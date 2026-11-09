"use client";
import { ArrowRight, Lock, Mic, Music2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { SheetResult } from "@/components/music/SheetResult";
import { SheetTile, TileSkeletons } from "@/components/app/SheetTile";
import { EmptyState, ErrorState, PageTitle } from "@/components/app/States";
import { Cta } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSheets } from "@/lib/useSheets";
import { personalLine } from "@/components/funnel/TryFlow";

export function Dashboard() {
  const { me, unlock, plans, ensurePlans } = useUnlock();
  const { sheets, error, reload } = useSheets();
  const latest = sheets?.[0];
  const first = me?.name?.split(" ")[0];
  const featured = plans?.find((p) => p.featured);
  useEffect(() => {
    if (latest?.locked) ensurePlans();
  }, [latest?.locked, ensurePlans]);

  return (
    <div>
      <PageTitle label="DASHBOARD" title={first ? `Hey ${first}, what's the tune today?` : "What's the tune today?"} />

      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="album relative overflow-hidden rounded-[24px] p-6 ring-1 ring-white/10 md:p-7">
          <p className="label !text-fg/70">[ NEW SONG SHEET ]</p>
          <p className="mt-2 max-w-[340px] text-[24px] font-semibold leading-tight tracking-[-0.03em]">Got a melody in your head? Catch it before it fades.</p>
          <div className="mt-6">
            <Cta href="/studio?new=1" size="md">
              Make my song sheet
            </Cta>
          </div>
          <Mic className="absolute -bottom-6 -right-4 h-40 w-40 text-white/[0.06]" />
        </div>
        <div className="rounded-[24px] bg-card p-6 ring-1 ring-white/[0.08]">
          {!me ? (
            <Skeleton className="h-28" />
          ) : me.tier ? (
            <>
              <p className="label">This month</p>
              <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.04em] tabular">
                {me.used}
                <span className="text-[18px] text-muted"> / {me.tier.sheetsPerMonth}</span>
              </p>
              <p className="mt-1 text-[14px] text-muted">song sheets on {me.plan?.name.replace(/^MelodyFlow\s+/i, "")}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (me.used / me.tier.sheetsPerMonth) * 100)}%` }} transition={{ duration: 1.1, ease: "easeOut" }} />
              </div>
              {me.until && <p className="mt-3 text-[12.5px] text-dim">Refills {new Date(me.until).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>}
            </>
          ) : (
            <>
              <p className="label">Free</p>
              <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">3 song sheets a day, first 2 bars in clear</p>
              <p className="mt-1 text-[14px] text-muted">A plan unlocks every bar, the key, the chords and PDF export.</p>
              <button onClick={() => unlock()} className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-lime hover:underline">
                See plans <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Latest</h2>
          {sheets && sheets.length > 0 && (
            <Link href="/studio" className="text-[14px] text-muted hover:text-fg">
              All sheets →
            </Link>
          )}
        </div>
        {error ? (
          <ErrorState text="We couldn't load your song sheets." onRetry={reload} />
        ) : !sheets ? (
          <Skeleton className="h-[420px] rounded-[24px]" />
        ) : !latest ? (
          <EmptyState icon={<Music2 className="h-5 w-5" />} text="No song sheets yet. Hum your first melody: it takes 10 seconds." action={<Cta href="/studio?new=1" size="md">Make my song sheet</Cta>} />
        ) : (
          <>
            <SheetResult
              view={latest}
              onUnlock={() => unlock({ title: "Your song sheet is ready.", line: personalLine(latest), onUnlocked: reload })}
              toolbar={
                !latest.locked && (
                  <Link href={`/studio/${latest.id}`} className="shrink-0 rounded-full bg-black/40 px-3.5 py-2 text-[13px] font-medium ring-1 ring-white/15 hover:bg-black/60">
                    Open
                  </Link>
                )
              }
            />
            {sheets.length > 1 && (
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {sheets.slice(1, 7).map((s) => (
                  <SheetTile key={s.id} s={s} />
                ))}
              </div>
            )}
          </>
        )}
        {!sheets && !error && (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            <TileSkeletons />
          </div>
        )}
      </div>

      {latest?.locked && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 px-4 md:bottom-6 md:left-[248px]">
          <button
            onClick={() => unlock({ title: "Your song sheet is ready.", line: personalLine(latest), onUnlocked: reload })}
            className="glass mx-auto flex h-[58px] w-full max-w-[520px] items-center justify-between rounded-full pl-6 pr-2 text-[15px] font-semibold"
          >
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-lime" /> See my full sheet
              {featured && <span className="font-normal text-muted">· {featured.month.perDay} / day</span>}
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
              <ArrowRight className="h-5 w-5" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
