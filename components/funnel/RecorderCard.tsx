"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Mic, Play, Square, Upload } from "lucide-react";
import { useRef } from "react";
import { PianoRoll } from "@/components/music/PianoRoll";
import { Button } from "@/components/ui/button";
import { STEPS, type useTranscriber } from "@/lib/useTranscriber";
import { cn } from "@/lib/utils";

type Tx = ReturnType<typeof useTranscriber>;

const r2 = (n: number) => Math.round(n * 100) / 100;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** The waveform ring around the record button (signature element #1). */
function Ring({ level, active }: { level: number[]; active: boolean }) {
  const n = level.length;
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
      {level.map((v, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r0 = 70;
        const len = active ? 6 + v * 24 : 5 + 3 * Math.abs(Math.sin(i * 0.9));
        return (
          <line
            key={i}
            x1={r2(100 + Math.cos(a) * r0)}
            y1={r2(100 + Math.sin(a) * r0)}
            x2={r2(100 + Math.cos(a) * (r0 + len))}
            y2={r2(100 + Math.sin(a) * (r0 + len))}
            stroke={active ? "#FF6B4A" : "#C8FF3D"}
            strokeOpacity={active ? r2(0.5 + v * 0.5) : 0.35}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: "all 80ms linear" }}
          />
        );
      })}
    </svg>
  );
}

export function RecorderCard({
  tx,
  maxSeconds,
  onErrorAction,
  compact = false,
}: {
  tx: Tx;
  maxSeconds: number;
  onErrorAction?: (code: string) => React.ReactNode;
  compact?: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const { phase } = tx;
  const recording = phase === "recording";

  return (
    <div className={cn("relative", compact ? "p-5" : "p-6 md:p-8")}>
      <AnimatePresence mode="wait" initial={false}>
        {(phase === "idle" || phase === "recording") && (
          <motion.div key="rec" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex flex-col items-center">
            <div className="relative h-[200px] w-[200px]">
              <Ring level={tx.level} active={recording} />
              <button
                onClick={recording ? tx.stopRecording : tx.startRecording}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className={cn(
                  "absolute left-1/2 top-1/2 grid h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition active:scale-95",
                  recording ? "bg-coral text-ink [animation:rec-pulse_1.4s_ease-out_infinite]" : "bg-lime text-ink shadow-[0_0_60px_rgba(200,255,61,.35)] hover:scale-[1.03]",
                )}
              >
                {recording ? <Square className="h-9 w-9 fill-current" /> : <Mic className="h-10 w-10" strokeWidth={2.2} />}
              </button>
            </div>
            <p className="mt-1 text-[17px] font-semibold tracking-[-0.01em]" aria-live="polite">
              {recording ? (
                <span className="tabular">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-coral align-middle" />
                  {fmt(tx.elapsed)} <span className="text-muted">/ {fmt(maxSeconds)}</span>
                </span>
              ) : (
                "Tap and hum your melody"
              )}
            </p>
            <p className="mt-1 text-[13.5px] text-muted">
              {recording ? "Tap again when you're done" : `Sing, hum, whistle or play · up to ${maxSeconds} s`}
            </p>
            {recording ? (
              <Button className="mt-6" size="lg" onClick={tx.stopRecording}>
                Stop &amp; make my song sheet
              </Button>
            ) : (
              <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => file.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload a voice memo
                </Button>
                <Button variant="subtle" size="lg" className="w-full sm:w-auto" onClick={tx.example}>
                  <Play className="h-4 w-4 fill-current" /> Try an example
                </Button>
                <input
                  ref={file}
                  type="file"
                  accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.webm,.caf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) tx.upload(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </motion.div>
        )}

        {(phase === "working" || phase === "ready") && (
          <motion.div key="work" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-end justify-between">
              <div>
                <p className="label">[ WRITING YOUR SONG SHEET ]</p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
                  {phase === "ready" ? "Your song sheet is ready." : "Writing your song sheet…"}
                </p>
              </div>
              <p className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-lime tabular" aria-live="polite">
                {Math.floor(tx.pct)}
                <span className="text-[20px] text-muted">%</span>
              </p>
            </div>
            <div className="mt-5">
              <PianoRoll midi={tx.curve} progress={Math.min(1, tx.pct / 100)} />
            </div>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {STEPS.map((s, i) => {
                const done = tx.stepIdx > i;
                const now = tx.stepIdx === i;
                return (
                  <li key={s} className={cn("flex items-center gap-2.5 text-[14px] transition-colors", done ? "text-fg" : now ? "text-fg/80" : "text-dim")}>
                    <span className={cn("grid h-5 w-5 place-items-center rounded-full transition", done ? "bg-lime text-ink" : "ring-1 ring-white/15")}>
                      {done ? (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 400 }}>
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </motion.span>
                      ) : now ? (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                      ) : null}
                    </span>
                    {s}
                  </li>
                );
              })}
            </ul>
            {phase === "ready" && (
              <motion.div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-lime" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.1 }} />
            )}
          </motion.div>
        )}

        {phase === "error" && tx.error && (
          <motion.div key="err" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/15 text-coral">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="mt-4 max-w-[380px] text-[16px] leading-relaxed">{tx.error.message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {onErrorAction?.(tx.error.code)}
              <Button variant="subtle" size="lg" onClick={tx.reset}>
                Try again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
