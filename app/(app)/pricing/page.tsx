"use client";
import { useEffect } from "react";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { Paywall } from "@/components/funnel/Paywall";

// The same paywall, as a page (checkout pages send people back here when they cancel).
export default function Pricing() {
  const { plans, ensurePlans, checkout, busy, notice, me } = useUnlock();
  useEffect(() => {
    ensurePlans();
  }, [ensurePlans]);
  return (
    <div className="mx-auto max-w-[480px]">
      <Paywall
        plans={plans}
        title={me?.paid ? "Change your plan." : "Your song sheets are waiting."}
        line={me?.paid ? `You're on ${me.plan?.name.replace(/^MelodyFlow\s+/i, "")}. Pick the plan that fits how much you write.` : "Unlock every bar, the key, the chords and PDF export."}
        busy={busy}
        notice={notice}
        onContinue={checkout}
        initialPlan={me?.paid ? plans?.[me.rank + 1]?.id ?? me.plan?.id : null}
      />
    </div>
  );
}
