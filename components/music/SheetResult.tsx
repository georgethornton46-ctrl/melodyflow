"use client";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { keyName, usesFlats, type Note, type Sheet } from "@/lib/music";
import type { SheetView } from "@/lib/types";
import { StaffView } from "./StaffView";
import { Waveform } from "./Waveform";
import { cn } from "@/lib/utils";

function dur(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

/** The song-sheet card (signature element #2): album-like header, key & chords, staff + tab. */
export function SheetResult({
  view,
  override,
  onUnlock,
  unlockLabel = "See my full sheet",
  mode = "both",
  showNames = true,
  toolbar,
  className,
  id,
}: {
  view: SheetView;
  override?: { notes: Note[]; chords: string[]; key: Sheet["key"] } | null; // transposed
  onUnlock?: () => void;
  unlockLabel?: string;
  mode?: "both" | "notes" | "tab";
  showNames?: boolean;
  toolbar?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const locked = view.locked;
  const key = override?.key ?? view.key;
  const chords = override?.chords ?? view.chords;
  const notes = override?.notes ?? view.notes;
  const flats = key ? usesFlats(key) : false;
  const uniq = chords ? Array.from(new Set(chords)) : [];

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.8, 0.24, 1] }}
      className={cn("overflow-hidden rounded-[24px] bg-[#0d0e0b] ring-1 ring-white/10", className)}
    >
      {/* album header */}
      <div className="album relative px-5 pb-5 pt-5 md:px-7 md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label !text-fg/70">[ SONG SHEET ]</p>
            <h3 className="mt-1.5 truncate text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">{view.title}</h3>
            <p className="mt-1 font-mono text-[11.5px] uppercase tracking-[0.12em] text-fg/70 tabular">
              {view.noteCount} notes · {view.bpm} BPM · {view.bars} bars · {dur(view.duration)}
            </p>
          </div>
          {toolbar}
        </div>
        <Waveform peaks={view.waveform} className="mt-4 h-9" color="#F4F5EF" />
      </div>

      {/* key / chords / insight */}
      <div className="grid gap-3 px-5 pt-5 sm:grid-cols-3 md:px-7">
        <button
          type="button"
          onClick={locked ? onUnlock : undefined}
          className={cn("relative rounded-[16px] bg-white/[0.04] p-4 text-left ring-1 ring-white/[0.07]", locked && "cursor-pointer")}
        >
          <p className="label">Key</p>
          {key ? (
            <p className="mt-1.5 text-[24px] font-semibold tracking-[-0.02em] text-lime">{keyName(key)}</p>
          ) : (
            <div className="mt-2.5 flex items-center gap-2" aria-label="Key locked">
              <span className="h-6 w-28 rounded-md bg-lime/60 blur-[7px]" />
              <Lock className="h-4 w-4 text-muted" />
            </div>
          )}
        </button>
        <button
          type="button"
          onClick={locked ? onUnlock : undefined}
          className={cn("relative rounded-[16px] bg-white/[0.04] p-4 text-left ring-1 ring-white/[0.07]", locked && "cursor-pointer")}
        >
          <p className="label">Chords</p>
          {chords ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {uniq.slice(0, 6).map((c) => (
                <span key={c} className="rounded-lg bg-lime/10 px-2 py-0.5 text-[15px] font-semibold text-lime ring-1 ring-lime/25">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-2.5 flex items-center gap-1.5" aria-label="Chords locked">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-6 w-9 rounded-md bg-lime/50 blur-[6px]" />
              ))}
              <Lock className="ml-1 h-4 w-4 text-muted" />
            </div>
          )}
        </button>
        <div className="rounded-[16px] bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
          <p className="label flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Insight
          </p>
          <p className="mt-1.5 text-[14px] leading-snug text-fg/90">{view.insight}</p>
        </div>
      </div>

      {/* the sheet */}
      <div className="relative px-3 pb-5 pt-4 md:px-5">
        <StaffView
          notes={notes}
          contour={view.contour}
          chords={chords ?? null}
          bars={view.bars}
          flats={flats}
          lockedFrom={locked ? view.clearBars : null}
          showNames={showNames}
          mode={mode}
          onLockedClick={locked ? onUnlock : undefined}
        />
        {locked && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#0d0e0b] via-[#0d0e0b]/80 to-transparent" />
        )}
        {locked && onUnlock && (
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-5">
            <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[12.5px] text-fg/80 ring-1 ring-white/10 backdrop-blur">
              <Lock className="h-3.5 w-3.5" /> {view.bars - view.clearBars} more bars, the key and the chords
            </span>
            <button
              onClick={onUnlock}
              className="cta flex h-[60px] items-center gap-3 rounded-full bg-lime pl-7 pr-2 text-[17px] font-semibold text-ink hover:bg-[#d4ff63]"
            >
              {unlockLabel}
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-lime">
                <Lock className="h-4.5 w-4.5" />
              </span>
            </button>
          </div>
        )}
      </div>
      {locked && <div className="h-24" />}
    </motion.div>
  );
}
