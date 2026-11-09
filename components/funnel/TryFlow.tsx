"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RecorderCard } from "./RecorderCard";
import { SheetResult } from "@/components/music/SheetResult";
import { useUnlock } from "./UnlockProvider";
import { claimTries } from "./AuthForm";
import { useTranscriber } from "@/lib/useTranscriber";
import { deviceId, lastTry, setLastTry } from "@/lib/device";
import { FREE } from "@/lib/plans";
import type { SheetView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function personalLine(v: SheetView) {
  return `${v.bars} bars · ${v.noteCount} notes · ${v.bpm} BPM. Your melody, written down.`;
}

export function TryFlow() {
  const { unlock, me, ensurePlans, plans } = useUnlock();
  const [view, setView] = useState<SheetView | null>(null);
  const [sheetOpenCount, setSheetOpenCount] = useState(0);
  const tx = useTranscriber({
    maxSeconds: FREE.maxSeconds,
    onSheet: (s) => {
      setLastTry(s.id);
      setView(s);
      ensurePlans();
    },
  });

  const reload = useCallback(async (id: string) => {
    const r = await fetch(`/api/sheets/${id}?device=${encodeURIComponent(deviceId())}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    setView(j.sheet);
    return j.sheet as SheetView;
  }, []);

  const openUnlock = useCallback(
    (v: SheetView) => {
      setSheetOpenCount((c) => c + 1);
      unlock({
        title: "Your song sheet is ready.",
        line: personalLine(v),
        onUnlocked: () => reload(v.id),
      });
    },
    [unlock, reload],
  );

  // returning visitor: land where they stopped
  useEffect(() => {
    const id = lastTry();
    const resume = new URLSearchParams(window.location.search).has("resume");
    (async () => {
      if (resume) {
        await claimTries();
        window.history.replaceState({}, "", "/");
      }
      if (!id) return;
      const v = await reload(id);
      if (!v) return setLastTry(null);
      ensurePlans();
      if (resume && v.locked) openUnlock(v);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showResult = view && (tx.phase === "idle" || tx.phase === "done");
  const featured = plans?.find((p) => p.featured);

  return (
    <div id="try" className="scroll-mt-28">
      <motion.div layout className={cn("mx-auto transition-[max-width] duration-500", showResult ? "max-w-[880px]" : "max-w-[620px]")}>
        <AnimatePresence mode="wait" initial={false}>
          {showResult && view ? (
            <motion.div key={view.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SheetResult view={view} onUnlock={() => openUnlock(view)} />
              {tx.notice && <p className="mt-3 text-center text-[13px] text-muted">{tx.notice}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {!view.locked && (
                  <Link href={`/studio/${view.id}`}>
                    <Button size="lg">
                      Open in Studio <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setView(null);
                    tx.reset();
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Record another melody
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card overflow-hidden rounded-[28px]">
              <RecorderCard
                tx={tx}
                maxSeconds={FREE.maxSeconds}
                onErrorAction={(code) =>
                  code === "daily_limit" ? (
                    <Button size="lg" onClick={() => unlock({ title: "Keep writing today.", line: "Your free song sheets refill tomorrow. A plan gives you a month of them, in full." })}>
                      See my options
                    </Button>
                  ) : null
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* sticky unlock bar once the paywall was closed */}
      <AnimatePresence>
        {showResult && view?.locked && sheetOpenCount > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3"
          >
            <button
              onClick={() => openUnlock(view)}
              className="glass mx-auto flex h-[60px] w-full max-w-[520px] items-center justify-between rounded-full pl-6 pr-2 text-[15.5px] font-semibold"
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-lime" /> See my full sheet
                {featured && <span className="font-normal text-muted">· {featured.month.perDay} / day</span>}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-lime text-ink">
                <ArrowRight className="h-5 w-5" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {me === null ? null : null}
    </div>
  );
}
