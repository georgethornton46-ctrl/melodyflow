"use client";
import { motion } from "framer-motion";

/** The piano-roll lane: pitch bars sliding in while the sheet is written. */
export function PianoRoll({ midi, progress }: { midi: number[]; progress: number }) {
  // downsample the pitch curve into ~48 columns
  const cols = 48;
  const step = Math.max(1, Math.floor(midi.length / cols));
  const pts: (number | null)[] = [];
  for (let i = 0; i < cols; i++) {
    const seg = midi.slice(i * step, (i + 1) * step).filter((v) => v > 0);
    pts.push(seg.length ? seg.sort((a, b) => a - b)[Math.floor(seg.length / 2)] : null);
  }
  const vals = pts.filter((v): v is number => v !== null);
  const lo = vals.length ? Math.min(...vals) - 2 : 55;
  const hi = vals.length ? Math.max(...vals) + 2 : 75;
  const shown = Math.floor(progress * cols);
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/[0.06]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="absolute inset-x-0 border-t border-white/[0.04]" style={{ top: `${(i / 8) * 100}%` }} />
      ))}
      {pts.map((v, i) =>
        v === null || i > shown ? null : (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.35 }}
            className="absolute h-[7px] origin-left rounded-full bg-lime shadow-[0_0_12px_rgba(200,255,61,.6)]"
            style={{ left: `${(i / cols) * 100}%`, width: `${(1 / cols) * 100 + 0.6}%`, top: `${(1 - (v - lo) / (hi - lo)) * 88 + 4}%` }}
          />
        ),
      )}
      <div
        className="absolute inset-y-0 w-px bg-lime/70 shadow-[0_0_18px_4px_rgba(200,255,61,.35)]"
        style={{ left: `${Math.min(100, progress * 100)}%`, transition: "left .3s linear" }}
      />
    </div>
  );
}
