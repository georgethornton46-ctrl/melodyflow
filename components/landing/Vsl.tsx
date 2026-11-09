"use client";
import { AnimatePresence, motion } from "framer-motion";
import { FileDown, Mic, Pause, Play, RotateCcw, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Cta } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCENES = [
  { cap: "11:42 PM. A melody hits you.", d: 8 },
  { cap: "By morning, it's voice memo #47. You never open it again.", d: 8 },
  { cap: "Figuring it out by ear? That's an evening gone.", d: 8 },
  { cap: "So you hum it into MelodyFlow.", d: 8 },
  { cap: "5 seconds later: notes, guitar tab and chords.", d: 9 },
  { cap: "Change the key. Print it. Send it to the band.", d: 8 },
  { cap: "Your melody, written down for good.", d: 8 },
];
const TOTAL = SCENES.reduce((s, x) => s + x.d, 0);

const tune = [64, 67, 69, 67, 72, 71, 69, 67, 65, 69, 67, 64];

function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative h-[300px] w-[150px] rounded-[30px] bg-[#0b0b0a] p-[6px] ring-1 ring-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] md:h-[360px] md:w-[180px] md:rounded-[36px]", className)}>
      <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-gradient-to-b from-[#1a1c2e] to-[#0c0c0e] md:rounded-[30px]">
        <div className="absolute left-1/2 top-2 h-[16px] w-[52px] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

function MiniStaff({ count, shift = 0, chords = true }: { count: number; shift?: number; chords?: boolean }) {
  return (
    <svg viewBox="0 0 320 120" className="w-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="10" x2="310" y1={40 + i * 10} y2={40 + i * 10} stroke="rgba(255,255,255,.35)" />
      ))}
      <line x1="160" x2="160" y1="40" y2="80" stroke="rgba(255,255,255,.35)" />
      {chords &&
        ["C", "G", "Am", "F"].map((c, i) => (
          <motion.text key={c} x={20 + i * 75} y="22" fill="#C8FF3D" fontSize="15" fontWeight="700" initial={{ opacity: 0, y: 6 }} animate={{ opacity: i < count / 3 ? 1 : 0, y: 0 }}>
            {c}
          </motion.text>
        ))}
      {tune.slice(0, count).map((m, i) => {
        const y = 80 - ((m + shift - 64) / 2) * 5.8;
        return (
          <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", damping: 14, stiffness: 300 }} style={{ originX: `${24 + i * 24}px`, originY: `${y}px` }}>
            <motion.ellipse cx={24 + i * 24} cy={y} rx="6" ry="4.5" fill="#C8FF3D" animate={{ cy: y }} transition={{ duration: 0.5 }} />
            <motion.line x1={30 + i * 24} x2={30 + i * 24} y1={y} y2={y - 26} stroke="#C8FF3D" strokeWidth="1.6" animate={{ y1: y, y2: y - 26 }} transition={{ duration: 0.5 }} />
          </motion.g>
        );
      })}
    </svg>
  );
}

function Scene({ i, t }: { i: number; t: number }) {
  // t = seconds inside the scene
  switch (i) {
    case 0:
      return (
        <div className="flex items-center justify-center gap-6">
          <Phone>
            <p className="mt-12 text-center text-[11px] text-white/70">Tuesday, November 10</p>
            <p className="text-center text-[44px] font-semibold leading-none tracking-[-0.04em] md:text-[52px]">11:42</p>
            <motion.div className="mx-2 mt-8 rounded-2xl bg-white/15 p-2.5 backdrop-blur" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 }}>
              <p className="flex items-center gap-1.5 text-[9px] text-white/70">
                <Mic className="h-2.5 w-2.5 text-coral" /> VOICE MEMOS · now
              </p>
              <p className="mt-0.5 text-[11px] font-medium">Recording… 0:{String(Math.min(14, Math.floor(t * 2))).padStart(2, "0")}</p>
              <div className="mt-1.5 flex h-5 items-center gap-[2px]">
                {Array.from({ length: 22 }).map((_, k) => (
                  <span key={k} className="w-[2px] rounded-full bg-coral" style={{ height: `${(20 + 70 * Math.abs(Math.sin(k * 1.3 + t * 3))).toFixed(1)}%` }} />
                ))}
              </div>
            </motion.div>
          </Phone>
        </div>
      );
    case 1:
      return (
        <div className="mx-auto w-full max-w-[340px] space-y-1.5">
          {[47, 46, 45, 44, 43, 42].map((n, k) => (
            <motion.div key={n} className="flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-2.5 ring-1 ring-white/[0.06]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: Math.max(0.15, 1 - k * 0.16 - t * 0.04), x: 0, filter: `blur(${Math.max(0, t - 3 - k) * 0.6}px)` }} transition={{ delay: k * 0.15 }}>
              <span className="text-[14px] font-medium">New Recording {n}</span>
              <span className="font-mono text-[11px] text-muted">0:{10 + ((n * 7) % 40)}</span>
            </motion.div>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="mx-auto w-full max-w-[420px]">
          <div className="relative h-[120px] rounded-xl bg-[#2a1d12] ring-1 ring-white/10">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="absolute inset-x-0 h-px bg-white/40" style={{ top: 14 + s * 18 }} />
            ))}
            {[1, 2, 3, 4, 5, 6, 7].map((f) => (
              <div key={f} className="absolute inset-y-0 w-[2px] bg-white/25" style={{ left: `${f * 12.5}%` }} />
            ))}
            {[0, 1, 2].map((k) => (
              <motion.span key={k} className="absolute grid h-7 w-7 place-items-center rounded-full bg-coral text-[14px] font-bold text-ink" animate={{ left: [`${10 + k * 25}%`, `${40 + k * 12}%`, `${18 + k * 22}%`], top: [10 + k * 30, 60 - k * 10, 20 + k * 20] }} transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", delay: k * 0.3 }}>
                ?
              </motion.span>
            ))}
          </div>
          <p className="mt-4 text-center font-mono text-[28px] font-medium tabular text-coral">
            {Math.floor(1 + t / 4)}h {String(Math.floor((t * 17) % 60)).padStart(2, "0")}m
          </p>
        </div>
      );
    case 3:
      return (
        <div className="flex flex-col items-center">
          <div className="relative grid h-36 w-36 place-items-center">
            {[0, 1, 2].map((k) => (
              <motion.span key={k} className="absolute inset-0 rounded-full ring-2 ring-lime" animate={{ scale: [0.7, 1.35], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: k * 0.6 }} />
            ))}
            <span className="grid h-24 w-24 place-items-center rounded-full bg-lime text-ink">
              <Mic className="h-10 w-10" />
            </span>
          </div>
          <div className="mt-6 flex h-10 items-center gap-[3px]">
            {Array.from({ length: 40 }).map((_, k) => (
              <span key={k} className="w-[3px] rounded-full bg-lime" style={{ height: `${(15 + 85 * Math.abs(Math.sin(k * 0.7 + t * 4)) * (k / 40 < t / 6 ? 1 : 0.15)).toFixed(1)}%` }} />
            ))}
          </div>
        </div>
      );
    case 4:
      return (
        <div className="album mx-auto w-full max-w-[460px] rounded-[22px] p-5 ring-1 ring-white/10">
          <p className="label !text-fg/70">[ SONG SHEET ]</p>
          <p className="mt-1 text-[18px] font-semibold">New Recording 48</p>
          <div className="mt-2 rounded-xl bg-black/40 p-2">
            <MiniStaff count={Math.min(tune.length, Math.floor(t * 3))} />
          </div>
          <div className="mt-2 flex gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/80">
            <span>C major</span>·<span>100 BPM</span>·<span>4 bars</span>
          </div>
        </div>
      );
    case 5: {
      const k = Math.floor(t / 2.5) % 3;
      return (
        <div className="mx-auto w-full max-w-[460px]">
          <div className="mb-3 flex justify-center gap-2">
            {["C", "D", "E"].map((c, i) => (
              <span key={c} className={cn("rounded-full px-4 py-1.5 text-[14px] font-semibold ring-1 transition", i === k ? "bg-lime text-ink ring-lime" : "ring-white/15 text-muted")}>
                {c} major
              </span>
            ))}
          </div>
          <div className="rounded-xl bg-black/40 p-2 ring-1 ring-white/10">
            <MiniStaff count={tune.length} shift={k * 2} chords={false} />
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <motion.span animate={{ y: t > 4 ? -4 : 0 }} className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-[14px]">
              <FileDown className="h-4 w-4 text-lime" /> Song-sheet.pdf
            </motion.span>
            <motion.span animate={{ x: t > 6 ? 6 : 0, opacity: t > 5 ? 1 : 0.4 }} className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-[14px]">
              <Send className="h-4 w-4 text-lime" /> The band
            </motion.span>
          </div>
        </div>
      );
    }
    default:
      return (
        <div className="flex flex-col items-center gap-6">
          <p className="h-display text-center text-[34px] md:text-[52px]">
            From voice memo
            <br />
            <span className="text-lime">to sheet music.</span>
          </p>
          <Cta href="#try" size="md">
            Make my song sheet
          </Cta>
        </div>
      );
  }
}

export function Vsl() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const hasVideo = process.env.NEXT_PUBLIC_VSL_VIDEO === "1";
  const box = useRef<HTMLDivElement>(null);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !reduce.current) {
          setPlaying(true);
          setStarted(true);
        } else setPlaying(false);
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setTime((t) => {
        const n = t + (now - last) / 1000;
        if (n >= TOTAL) {
          setPlaying(false);
          return TOTAL - 0.01;
        }
        return n;
      });
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  let acc = 0;
  let idx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (time >= acc && time < acc + SCENES[i].d) {
      idx = i;
      break;
    }
    acc += SCENES[i].d;
  }
  const local = time - acc;
  const ended = time >= TOTAL - 0.02;

  if (hasVideo)
    return (
      <div className="card overflow-hidden rounded-[28px]">
        <video src="/vsl.mp4" autoPlay muted playsInline controls className="aspect-video w-full" />
      </div>
    );

  return (
    <div ref={box} className="card relative overflow-hidden rounded-[28px]">
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
        <div className="top-glow absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
          <span className="label">[ 60-SECOND STORY ]</span>
          <span className="font-mono text-[11px] text-muted tabular">
            0:{String(Math.floor(time)).padStart(2, "0")} / 0:{TOTAL}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-6 pb-28 pt-14">
          <AnimatePresence mode="wait">
            <motion.div key={idx} className="w-full" initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(6px)" }} transition={{ duration: 0.55, ease: [0.22, 0.8, 0.24, 1] }}>
              {started || reduce.current ? <Scene i={idx} t={local} /> : <Scene i={0} t={0} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-10 md:px-8">
          <AnimatePresence mode="wait">
            <motion.p key={idx} className="text-center text-[22px] font-semibold leading-tight tracking-[-0.03em] md:text-[34px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {SCENES[idx].cap}
            </motion.p>
          </AnimatePresence>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                if (ended) {
                  setTime(0);
                  setPlaying(true);
                } else setPlaying((p) => !p);
                setStarted(true);
              }}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label={ended ? "Replay" : playing ? "Pause" : "Play"}
            >
              {ended ? <RotateCcw className="h-4 w-4" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <div className="flex flex-1 gap-1">
              {SCENES.map((s, i) => {
                const start = SCENES.slice(0, i).reduce((a, x) => a + x.d, 0);
                const p = Math.max(0, Math.min(1, (time - start) / s.d));
                return (
                  <button key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15" style={{ flexGrow: s.d }} onClick={() => (setTime(start), setStarted(true), setPlaying(true))} aria-label={`Scene ${i + 1}`}>
                    <span className="block h-full bg-lime" style={{ width: `${p * 100}%` }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
