"use client";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    WhopElements?: () => {
      checkout: {
        create: (o: Record<string, unknown>) => { create: (k: string) => { mount: (sel: string) => void }; destroy: () => void };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadWhop(): Promise<void> {
  if (window.WhopElements) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.whop.com/elements/amber/elements.js";
    s.setAttribute("data-whop-elements", "");
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("whop script"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Whop's checkout, embedded inside the sheet (via Kwop). */
export function WhopCheckout({
  embed,
  checkoutRef,
  fallbackUrl,
  onPaid,
}: {
  embed: string;
  checkoutRef: string;
  fallbackUrl: string | null;
  onPaid: (ref: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const paidRef = useRef(onPaid);
  paidRef.current = onPaid;
  useEffect(() => {
    let ck: { destroy: () => void } | null = null;
    let cancelled = false;
    let shown = false;
    const show = () => {
      shown = true;
      setReady(true);
    };
    const t2 = window.setInterval(() => {
      if (!shown && document.querySelector("#whop-checkout iframe")) {
        window.setTimeout(() => !shown && show(), 2000);
      }
    }, 500);
    const t15 = window.setTimeout(() => {
      if (!shown && fallbackUrl) window.location.href = fallbackUrl;
    }, 15000);
    loadWhop()
      .then(() => {
        if (cancelled || !window.WhopElements) return;
        const c = window.WhopElements().checkout.create({
          checkoutConfiguration: embed,
          returnUrl: `${location.origin}/dashboard?paid=1&ref=${encodeURIComponent(checkoutRef)}`,
          appearance: { theme: { appearance: "dark" } },
          onLoadingChange: (st: unknown) => {
            const loading = st && typeof st === "object" ? (st as { loading: boolean }).loading : st;
            if (loading === false) show();
          },
          onComplete: (r: { result?: string } | undefined) => {
            if (r && r.result === "payment") paidRef.current(checkoutRef);
          },
        });
        ck = c;
        c.create("checkout").mount("#whop-checkout");
      })
      .catch(() => {
        if (fallbackUrl) window.location.href = fallbackUrl;
      });
    return () => {
      cancelled = true;
      window.clearInterval(t2);
      window.clearTimeout(t15);
      try {
        ck?.destroy();
      } catch {}
    };
  }, [embed, checkoutRef, fallbackUrl]);

  return (
    <div>
      {!ready && (
        <div className="flex h-40 items-center justify-center gap-2 text-[14px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading secure checkout…
        </div>
      )}
      <div id="whop-checkout" className={ready ? "min-h-[380px]" : "h-0 overflow-hidden"} />
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-lime" /> Secure payment by Whop · Cancel in 1 click
      </p>
    </div>
  );
}
