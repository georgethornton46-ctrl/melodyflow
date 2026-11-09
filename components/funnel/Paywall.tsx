"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { money, money2, type PublicPlanC } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type Period = "month" | "year";

const FAQ = [
  {
    q: "Will it work with my voice?",
    a: "Yes. MelodyFlow reads the pitch of anything that holds a note: humming, singing, whistling, guitar, piano, violin. A quiet room and one melody at a time give the cleanest sheet.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, in two taps from Account → Billing. You keep your plan until the end of the period you paid for, and you're never charged again.",
  },
  {
    q: "What happens right after I pay?",
    a: "Your sheet unblurs right here, with every bar, the chords and the key. No email to check, no app to download.",
  },
];

export function PlanRows({
  plans,
  selected,
  onSelect,
  period,
}: {
  plans: PublicPlanC[];
  selected: number | null;
  onSelect: (id: number) => void;
  period: Period;
}) {
  return (
    <div role="radiogroup" aria-label="Plans" className="space-y-3">
      {plans.map((p) => {
        const on = p.id === selected;
        const price = period === "year" && p.year ? p.year : p.month;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(p.id)}
            className={cn(
              "relative flex w-full items-center gap-3.5 rounded-[18px] px-4 py-4 text-left transition active:scale-[0.985]",
              on ? "bg-lime/[0.07] ring-2 ring-lime" : "bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/20",
            )}
          >
            {p.featured && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink">
                Most popular
              </span>
            )}
            <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2", on ? "ring-lime" : "ring-white/25")}>
              {on && <span className="h-2.5 w-2.5 rounded-full bg-lime" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold tracking-[-0.01em]">{p.short}</span>
              <span className="block text-[13px] text-muted">
                {period === "year" && p.year ? (
                  <>
                    <s className="mr-1 text-dim">{money(p.month.cents * 12)}</s>
                    {money(p.year.cents)} / year
                  </>
                ) : (
                  <>{money(p.month.cents)} / month</>
                )}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-dim">{p.tag}</span>
            </span>
            <span className="text-right">
              <span className="block text-[22px] font-semibold tabular tracking-[-0.02em]">{price.perDay}</span>
              <span className="block text-[12px] text-muted">/ day</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Paywall({
  plans,
  title,
  line,
  onContinue,
  busy,
  notice,
  initialPlan,
}: {
  plans: PublicPlanC[] | null;
  title: string;
  line: string;
  onContinue: (plan: PublicPlanC, period: Period) => void;
  busy: boolean;
  notice: string | null;
  initialPlan?: number | null;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [sel, setSel] = useState<number | null>(initialPlan ?? null);
  const [faq, setFaq] = useState<number | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [btnVisible, setBtnVisible] = useState(true);
  useEffect(() => {
    if (plans && sel === null) setSel((plans.find((p) => p.featured) ?? plans[0])?.id ?? null);
  }, [plans, sel]);
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBtnVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [plans]);

  const plan = plans?.find((p) => p.id === sel) ?? null;
  const hasYear = !!plans?.some((p) => p.year);
  const due = plan ? (period === "year" && plan.year ? plan.year.cents : plan.month.cents) : 0;

  const cta = (floating = false) =>
    plan && (
      <button
        onClick={() => onContinue(plan, period === "year" && plan.year ? "year" : "month")}
        disabled={busy}
        className={cn(
          "cta flex h-[60px] w-full items-center justify-center gap-2 rounded-full bg-lime text-[17px] font-semibold text-ink hover:bg-[#d4ff63] disabled:opacity-70",
          floating && "shadow-[0_10px_40px_rgba(0,0,0,.6)]",
        )}
      >
        {busy ? "Opening secure checkout…" : `Continue with ${plan.short}`}
      </button>
    );

  return (
    <div className="relative px-5 pb-10 pt-16 md:px-8 md:pt-14">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 0.8, 0.24, 1] }}>
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/25">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-center text-[28px] font-semibold leading-[1.08] tracking-[-0.035em] md:text-[32px]">{title}</h2>
        <p className="mx-auto mt-2 max-w-[340px] text-center text-[15px] text-muted">{line}</p>
      </motion.div>

      <div className="mt-9 flex items-center justify-between">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Choose your plan.</h3>
        {hasYear && (
          <div className="flex rounded-full bg-white/[0.05] p-1 text-[13px] ring-1 ring-white/10" role="tablist" aria-label="Billing period">
            {(["month", "year"] as const).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={cn("rounded-full px-3 py-1.5 transition", period === p ? "bg-fg text-ink" : "text-muted hover:text-fg")}
              >
                {p === "month" ? "Monthly" : (
                  <>
                    Yearly <span className={cn(period === p ? "text-ink/60" : "text-lime")}>−20%</span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        {plans ? (
          <PlanRows plans={plans} selected={sel} onSelect={setSel} period={period} />
        ) : (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[86px] rounded-[18px]" />
            ))}
          </div>
        )}
      </div>

      <div ref={btnRef} className="mt-6">
        {cta()}
        {plan && (
          <p className="mt-3 text-center text-[13px] text-muted tabular">
            {money2(due)} due today, then every {period === "year" && plan.year ? "year" : "month"} · Cancel anytime
          </p>
        )}
        {notice && <p className="mt-3 rounded-xl bg-white/[0.05] px-4 py-3 text-center text-[14px] text-fg">{notice}</p>}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-muted">
        <ShieldCheck className="h-4 w-4 text-lime" />
        Secure payment, processed by Whop
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-medium text-fg">Whop</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-medium text-fg">
          <CreditCard className="h-3 w-3" /> Card
        </span>
      </div>

      {plan && (
        <div className="mt-9 rounded-[20px] bg-white/[0.03] p-5 ring-1 ring-white/[0.08]">
          <h4 className="text-[15px] font-semibold">What you unlock with {plan.short}</h4>
          <ul className="mt-3.5 space-y-2.5">
            {plan.unlocks.map((u) => (
              <li key={u} className="flex gap-2.5 text-[14.5px] text-fg/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 divide-y divide-white/[0.07] border-y border-white/[0.07]">
        {FAQ.map((f, i) => (
          <div key={f.q}>
            <button className="flex w-full items-center justify-between py-4 text-left text-[15px] font-medium" onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}>
              {f.q}
              <ChevronDown className={cn("h-4 w-4 text-muted transition", faq === i && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {faq === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4 text-[14px] leading-relaxed text-muted">
                  {f.a}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {plans && (
        <div className="mt-10">
          <h4 className="text-center text-[17px] font-semibold tracking-[-0.01em]">Pick up where you left off</h4>
          <div className="mt-4">
            <PlanRows plans={plans} selected={sel} onSelect={setSel} period={period} />
          </div>
          <div className="mt-5">{cta()}</div>
        </div>
      )}

      <p className="mt-8 text-center text-[11.5px] leading-relaxed text-dim">
        Renews automatically until canceled. Prices in USD. Taxes may apply.
      </p>

      <AnimatePresence>
        {!btnVisible && plan && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="sticky bottom-0 -mx-5 mt-4 bg-gradient-to-t from-[#0d0e0b] via-[#0d0e0b] to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 md:-mx-8 md:px-8"
          >
            {cta(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
