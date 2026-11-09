"use client";
import { Columns2, Music2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { RecorderCard } from "@/components/funnel/RecorderCard";
import { SheetTile, TileSkeletons } from "@/components/app/SheetTile";
import { EmptyState, ErrorState, PageTitle } from "@/components/app/States";
import { Button } from "@/components/ui/button";
import { useTranscriber } from "@/lib/useTranscriber";
import { useSheets } from "@/lib/useSheets";
import { FREE } from "@/lib/plans";

export function Studio() {
  const router = useRouter();
  const { me, unlock, upgrade, refreshMe } = useUnlock();
  const { sheets, error, reload } = useSheets();
  const [q, setQ] = useState("");
  const [compare, setCompare] = useState<string[] | null>(null);
  const maxSeconds = me?.tier?.maxSeconds ?? FREE.maxSeconds;
  const tx = useTranscriber({
    maxSeconds,
    onSheet: (s) => {
      refreshMe();
      router.push(`/studio/${s.id}?new=1`);
    },
  });

  const list = sheets?.filter((s) => s.title.toLowerCase().includes(q.toLowerCase())) ?? null;

  return (
    <div>
      <PageTitle label="STUDIO" title="Record a melody" />
      <div className="card overflow-hidden rounded-[26px]">
        <RecorderCard
          tx={tx}
          maxSeconds={maxSeconds}
          onErrorAction={(code) => {
            if (code === "quota")
              return (
                <Button size="lg" onClick={() => upgrade({ reason: `You've used all ${me?.tier?.sheetsPerMonth} song sheets this month.` })}>
                  Get more song sheets
                </Button>
              );
            if (code === "too_long")
              return (
                <Button size="lg" onClick={() => (me?.paid ? upgrade({ reason: "Record longer takes" }) : unlock())}>
                  Record longer takes
                </Button>
              );
            if (code === "daily_limit")
              return (
                <Button size="lg" onClick={() => unlock({ title: "Keep writing today.", line: "Your free song sheets refill tomorrow. A plan gives you a month of them, in full." })}>
                  See my options
                </Button>
              );
            return null;
          }}
        />
      </div>
      {tx.notice && <p className="mt-3 text-center text-[13px] text-muted">{tx.notice}</p>}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Your song sheets</h2>
        <div className="flex items-center gap-2">
          {sheets && sheets.length > 1 && (
            <Button
              variant={compare ? "lime" : "outline"}
              size="sm"
              onClick={() => {
                if (!me?.tier?.compare) return upgrade({ reason: "Compare two takes side by side" });
                setCompare(compare ? null : []);
              }}
            >
              <Columns2 className="h-4 w-4" /> {compare ? "Cancel" : "Compare takes"}
            </Button>
          )}
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-36 rounded-full bg-white/[0.05] pl-9 pr-3 text-[14px] ring-1 ring-white/10 outline-none focus:ring-lime/60 md:w-48" />
          </label>
        </div>
      </div>
      {compare && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-lime/10 px-4 py-3 text-[14px] ring-1 ring-lime/30">
          <span>Pick two takes to compare ({compare.length}/2)</span>
          <Button size="sm" disabled={compare.length !== 2} onClick={() => router.push(`/studio/compare?a=${compare[0]}&b=${compare[1]}`)}>
            Compare
          </Button>
        </div>
      )}
      <div className="mt-5">
        {error ? (
          <ErrorState text="We couldn't load your song sheets." onRetry={reload} />
        ) : !list ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <TileSkeletons n={6} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={<Music2 className="h-5 w-5" />} text={q ? "No song sheet matches this search." : "Nothing here yet. Tap the green button above and hum."} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {list.map((s) => (
              <SheetTile
                key={s.id}
                s={s}
                selected={compare?.includes(s.id)}
                onSelect={
                  compare
                    ? () => setCompare((c) => (c!.includes(s.id) ? c!.filter((x) => x !== s.id) : c!.length < 2 ? [...c!, s.id] : c))
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
      {me?.tier?.historyDays && <p className="mt-6 text-center text-[12.5px] text-dim">Your plan keeps song sheets for {me.tier.historyDays} days.</p>}
    </div>
  );
}
