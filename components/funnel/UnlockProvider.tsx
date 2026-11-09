"use client";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { LogoMark } from "@/components/brand/Logo";
import { AuthForm } from "./AuthForm";
import { Paywall, type Period } from "./Paywall";
import { WhopCheckout } from "./Checkout";
import { UnlockFilm } from "./UnlockFilm";
import { money2, type MeC, type PublicPlanC } from "@/lib/types";

type UnlockOpts = { title?: string; line?: string; onUnlocked?: () => void; authTitle?: string };
type UpgradeOpts = { reason: string; onUnlocked?: () => void };

type Ctx = {
  me: MeC | null;
  meLoaded: boolean;
  plans: PublicPlanC[] | null;
  refreshMe: () => Promise<MeC | null>;
  unlock: (o?: UnlockOpts) => void;
  upgrade: (o: UpgradeOpts) => void;
  signIn: (o: { title: string; then?: () => void }) => void;
  ensurePlans: () => Promise<PublicPlanC[] | null>;
  checkout: (plan: PublicPlanC, period: Period) => void;
  busy: boolean;
  notice: string | null;
};

const UnlockCtx = createContext<Ctx | null>(null);
export const useUnlock = () => {
  const c = useContext(UnlockCtx);
  if (!c) throw new Error("useUnlock outside UnlockProvider");
  return c;
};

type Step = null | "auth" | "paywall" | "upgrade";

export function trackEvent(type: "paywall_view" | "feature_used", detail?: string) {
  fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, detail }), keepalive: true }).catch(() => {});
}

export function UnlockProvider({ children, initialMe = null }: { children: React.ReactNode; initialMe?: MeC | null }) {
  const [me, setMe] = useState<MeC | null>(initialMe);
  const [meLoaded, setMeLoaded] = useState(!!initialMe);
  const [plans, setPlans] = useState<PublicPlanC[] | null>(null);
  const [step, setStep] = useState<Step>(null);
  const [opts, setOpts] = useState<UnlockOpts>({});
  const [upOpts, setUpOpts] = useState<UpgradeOpts | null>(null);
  const [authOpts, setAuthOpts] = useState<{ title: string; then?: () => void } | null>(null);
  const [checkout, setCheckout] = useState<null | { plan: PublicPlanC; period: Period; embed: string; ref: string; fallback: string | null }>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [film, setFilm] = useState<string | null>(null);
  const after = useRef<(() => void) | undefined>(undefined);

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      const j = await r.json();
      setMe(j.me ?? null);
      setMeLoaded(true);
      return (j.me ?? null) as MeC | null;
    } catch {
      setMeLoaded(true);
      return null;
    }
  }, []);

  const loadPlans = useCallback(async () => {
    if (plans) return plans;
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch("/api/plans");
        if (r.ok) {
          const j = await r.json();
          setPlans(j.plans);
          return j.plans as PublicPlanC[];
        }
      } catch {}
    }
    return null;
  }, [plans]);

  useEffect(() => {
    if (!initialMe) refreshMe();
  }, [initialMe, refreshMe]);

  const openPaywall = useCallback(() => {
    setNotice(null);
    setStep("paywall");
    loadPlans();
    trackEvent("paywall_view");
  }, [loadPlans]);

  const unlock = useCallback(
    (o: UnlockOpts = {}) => {
      setOpts(o);
      after.current = o.onUnlocked;
      loadPlans();
      if (!me) setStep("auth");
      else openPaywall();
    },
    [me, loadPlans, openPaywall],
  );

  const upgrade = useCallback(
    (o: UpgradeOpts) => {
      setUpOpts(o);
      after.current = o.onUnlocked;
      setNotice(null);
      loadPlans();
      if (!me) {
        setOpts({});
        setStep("auth");
      } else if (!me.paid) openPaywall();
      else {
        setStep("upgrade");
        trackEvent("paywall_view");
      }
    },
    [me, loadPlans, openPaywall],
  );

  const signIn = useCallback((o: { title: string; then?: () => void }) => {
    setAuthOpts(o);
    setStep("auth");
  }, []);

  async function startCheckout(plan: PublicPlanC, period: Period) {
    setBusy(true);
    setNotice(null);
    try {
      const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan.id, period }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) {
        setNotice("Payments open in a moment. Your song sheet is saved.");
        return;
      }
      if (r.status === 401) {
        setStep("auth");
        return;
      }
      if (!r.ok) {
        setNotice(j.error || "The checkout could not open. Try again.");
        return;
      }
      if (!j.embed) {
        if (j.fallback_url) window.location.href = j.fallback_url;
        return;
      }
      setCheckout({ plan, period, embed: j.embed, ref: j.ref, fallback: j.fallback_url });
    } catch {
      setNotice("The checkout could not open. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const confirmPaid = useCallback(
    async (ref: string) => {
      setCheckout(null);
      setStep(null);
      try {
        for (let i = 0; i < 4; i++) {
          const r = await fetch("/api/checkout/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref }) });
          const j = await r.json();
          if (j.me) setMe(j.me);
          if (j.paid && j.me?.paid) {
            setFilm(j.me.plan?.name?.replace(/^MelodyFlow\s+/i, "") || "your plan");
            return;
          }
          await new Promise((res) => setTimeout(res, 1500));
        }
        setNotice("Your payment is being confirmed. It can take a minute: refresh this page shortly.");
        setStep("paywall");
      } catch {
        setNotice("We couldn't confirm your payment yet. Refresh this page in a minute.");
        setStep("paywall");
      }
    },
    [],
  );

  // back from the fallback checkout page: /dashboard?paid=1&ref=…
  useEffect(() => {
    const u = new URL(window.location.href);
    const ref = u.searchParams.get("ref");
    if (u.searchParams.get("paid") === "1" && ref) {
      u.searchParams.delete("paid");
      u.searchParams.delete("ref");
      window.history.replaceState({}, "", u.pathname + (u.search ? u.search : ""));
      confirmPaid(ref);
    }
  }, [confirmPaid]);

  const nextPlan = plans && me ? plans[me.rank + 1] ?? null : null;

  return (
    <UnlockCtx.Provider value={{ me, meLoaded, plans, refreshMe, unlock, upgrade, signIn, ensurePlans: loadPlans, checkout: startCheckout, busy, notice }}>
      {children}

      {/* sign-up sheet */}
      <Sheet open={step === "auth"} onClose={() => setStep(null)} label="Sign up" closeSide="left" width={440}>
        <div className="px-6 pb-8 pt-10 md:px-9 md:pt-12">
          <div className="mb-5 flex justify-center">
            <LogoMark className="h-10 w-10" />
          </div>
          <h2 className="text-center text-[26px] font-semibold tracking-[-0.035em]">{authOpts?.title || opts.authTitle || "Save your song sheet"}</h2>
          <p className="mb-7 mt-1.5 text-center text-[14.5px] text-muted">One tap. Your sheet waits for you in your account.</p>
          <AuthForm
            mode="signup"
            onDone={async () => {
              const m = await refreshMe();
              if (authOpts) {
                const t = authOpts.then;
                setAuthOpts(null);
                setStep(null);
                t?.();
                return;
              }
              if (m?.paid) {
                setStep(null);
                after.current?.();
              } else openPaywall();
            }}
          />
        </div>
      </Sheet>

      {/* paywall */}
      <Sheet open={step === "paywall"} onClose={() => setStep(null)} label="Choose your plan" full width={480} z={60}>
        <Paywall
          plans={plans}
          title={opts.title || "Your song sheet is ready."}
          line={opts.line || "Every bar, the chords and the key — written down and saved."}
          onContinue={startCheckout}
          busy={busy}
          notice={notice}
        />
      </Sheet>

      {/* upgrade sheet: the next plan only */}
      <Sheet open={step === "upgrade"} onClose={() => setStep(null)} label="Upgrade" width={440}>
        <div className="px-6 pb-8 pt-8 md:px-8">
          {nextPlan ? (
            <>
              <p className="label">[ UPGRADE ]</p>
              <h2 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.03em]">{upOpts?.reason}</h2>
              <div className="mt-5 rounded-[18px] bg-lime/[0.06] p-5 ring-1 ring-lime/40">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[18px] font-semibold">{nextPlan.short}</p>
                    <p className="text-[13px] text-muted">{nextPlan.tag}</p>
                  </div>
                  <p className="text-right">
                    <span className="text-[24px] font-semibold tabular">{nextPlan.month.perDay}</span>
                    <span className="text-[13px] text-muted"> / day</span>
                  </p>
                </div>
                <ul className="mt-4 space-y-2">
                  {nextPlan.adds.map((a) => (
                    <li key={a} className="flex gap-2 text-[14.5px]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => startCheckout(nextPlan, "month")}
                disabled={busy}
                className="cta mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-lime text-[16px] font-semibold text-ink disabled:opacity-70"
              >
                {busy ? "Opening secure checkout…" : `Upgrade to ${nextPlan.short}`} <ArrowUpRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-[12.5px] text-muted">
                {money2(nextPlan.month.cents)} a month · your current plan stops at the end of its period
              </p>
              {notice && <p className="mt-3 rounded-xl bg-white/[0.05] px-4 py-3 text-center text-[14px]">{notice}</p>}
            </>
          ) : (
            <>
              <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.03em]">{upOpts?.reason}</h2>
              <p className="mt-2 text-[15px] text-muted">You&apos;re on our biggest plan. Your quota refills at the start of your next billing month.</p>
            </>
          )}
        </div>
      </Sheet>

      {/* the checkout, inside the page */}
      <Sheet open={!!checkout} onClose={() => setCheckout(null)} label="Secure checkout" width={520} z={70} closeSide="right">
        {checkout && (
          <div className="px-5 pb-6 pt-4 md:px-7 md:pt-6">
            <div className="mb-4 pr-10">
              <p className="text-[18px] font-semibold tracking-[-0.02em]">MelodyFlow {checkout.plan.short}</p>
              <p className="text-[13.5px] text-muted tabular">
                {money2(checkout.period === "year" && checkout.plan.year ? checkout.plan.year.cents : checkout.plan.month.cents)} /{" "}
                {checkout.period === "year" ? "year" : "month"} ·{" "}
                {checkout.period === "year" && checkout.plan.year ? checkout.plan.year.perDay : checkout.plan.month.perDay} a day
              </p>
            </div>
            <WhopCheckout embed={checkout.embed} checkoutRef={checkout.ref} fallbackUrl={checkout.fallback} onPaid={confirmPaid} />
          </div>
        )}
      </Sheet>

      <AnimatePresence>
        {film && (
          <UnlockFilm
            plan={film}
            onDone={() => {
              setFilm(null);
              after.current?.();
            }}
          />
        )}
      </AnimatePresence>
    </UnlockCtx.Provider>
  );
}
