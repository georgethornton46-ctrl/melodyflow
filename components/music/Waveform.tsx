import { cn } from "@/lib/utils";

/** Static waveform from peaks (0..1). */
export function Waveform({ peaks, className, progress = 1, color = "#C8FF3D" }: { peaks: number[]; className?: string; progress?: number; color?: string }) {
  const n = peaks.length || 1;
  return (
    <svg viewBox={`0 0 ${n * 4} 40`} preserveAspectRatio="none" className={cn("h-10 w-full", className)} aria-hidden>
      {peaks.map((p, i) => {
        const h = Math.max(2, p * 36);
        return (
          <rect
            key={i}
            x={i * 4 + 0.6}
            y={20 - h / 2}
            width={2.4}
            height={h}
            rx={1.2}
            fill={i / n <= progress ? color : "rgb(255 255 255 / .18)"}
          />
        );
      })}
    </svg>
  );
}

/** Decorative animated equalizer bars. */
export function EqBars({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex h-4 items-end gap-[3px]", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-current"
          style={{ height: "100%", animation: `eq ${0.7 + (i % 3) * 0.18}s ease-in-out ${i * 0.09}s infinite` }}
        />
      ))}
    </span>
  );
}
