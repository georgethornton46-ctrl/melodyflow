"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Download, KeyRound, Music2, X } from "lucide-react";
import { useEffect, useState } from "react";

/** After paying: 3 short scenes in ~5 s, skippable. */
export function UnlockFilm({ plan, onDone }: { plan: string; onDone: () => void }) {
  const [scene, setScene] = useState(0);
  useEffect(() => {
    const t = [window.setTimeout(() => setScene(1), 1600), window.setTimeout(() => setScene(2), 3500), window.setTimeout(onDone, 5200)];
    return () => t.forEach(clearTimeout);
  }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="top-glow pointer-events-none absolute inset-0" />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <button onClick={onDone} aria-label="Skip" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] hover:bg-white/[0.14]">
        <X className="h-4 w-4" />
      </button>
      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div key="a" className="relative px-6 text-center" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring", damping: 18 }}>
            <motion.div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[26px] bg-lime text-ink" initial={{ rotate: -12, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", damping: 10, stiffness: 180 }}>
              <Music2 className="h-9 w-9" />
            </motion.div>
            <p className="label">[ WELCOME ]</p>
            <h2 className="h-display mt-3 text-[44px] md:text-[64px]">You&apos;re on {plan}</h2>
          </motion.div>
        )}
        {scene === 1 && (
          <motion.div key="b" className="relative px-6 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <p className="label">[ NOW UNLOCKED ]</p>
            <div className="mt-6 flex justify-center gap-4 md:gap-8">
              {[
                { i: Music2, t: "Every bar" },
                { i: KeyRound, t: "Key & chords" },
                { i: Download, t: "PDF export" },
              ].map(({ i: I, t }, k) => (
                <motion.div key={t} className="w-24 md:w-32" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * k }}>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.06] text-lime ring-1 ring-white/10 md:h-20 md:w-20">
                    <I className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-[14px] font-medium">{t}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {scene === 2 && (
          <motion.div key="c" className="relative px-6 text-center" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <h2 className="h-display text-[56px] text-lime md:text-[88px]">Let&apos;s go.</h2>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
