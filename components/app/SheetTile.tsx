"use client";
import { Lock } from "lucide-react";
import Link from "next/link";
import { keyName } from "@/lib/music";
import type { SheetView } from "@/lib/types";
import { cn } from "@/lib/utils";

const GRADS = [
  "radial-gradient(120% 90% at 0% 0%, rgb(200 255 61 / .28), transparent 55%), radial-gradient(90% 90% at 100% 0%, rgb(91 108 255 / .45), transparent 60%), #111",
  "radial-gradient(120% 90% at 100% 0%, rgb(255 107 74 / .35), transparent 55%), radial-gradient(90% 90% at 0% 100%, rgb(200 255 61 / .25), transparent 60%), #111",
  "radial-gradient(120% 90% at 50% 0%, rgb(91 108 255 / .4), transparent 55%), radial-gradient(90% 90% at 100% 100%, rgb(255 107 74 / .3), transparent 60%), #111",
];

export function SheetTile({ s, selected, onSelect }: { s: SheetView; selected?: boolean; onSelect?: () => void }) {
  const grad = GRADS[parseInt(s.id.slice(0, 2), 16) % GRADS.length];
  const ys = [...s.notes.map((n) => ({ s: n.s, m: n.m })), ...s.contour.map((c) => ({ s: c.s, m: c.y }))];
  const lo = Math.min(...ys.map((y) => y.m), 60);
  const hi = Math.max(...ys.map((y) => y.m), 72);
  const end = Math.max(16, ...ys.map((y) => y.s + 2));
  const inner = (
    <>
      <div className="relative aspect-[5/3] w-full overflow-hidden" style={{ background: grad }}>
        <svg viewBox="0 0 200 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {ys.map((n, i) => (
            <rect key={i} x={(n.s / end) * 190 + 5} y={100 - ((n.m - lo) / Math.max(1, hi - lo)) * 80} width={5} height={4} rx={2} fill="#F4F5EF" opacity={0.85} />
          ))}
        </svg>
        {s.locked && (
          <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/60 ring-1 ring-white/15">
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-[15.5px] font-semibold tracking-[-0.01em]">{s.title}</p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
          {s.key ? keyName(s.key) : "Key locked"} · {s.bpm} BPM · {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </>
  );
  const cls = cn(
    "group block overflow-hidden rounded-[20px] bg-card ring-1 ring-white/[0.08] transition hover:-translate-y-0.5 hover:ring-white/20 active:scale-[0.985]",
    selected && "ring-2 ring-lime",
  );
  if (onSelect)
    return (
      <button onClick={onSelect} className={cn(cls, "text-left")}>
        {inner}
      </button>
    );
  return (
    <Link href={`/studio/${s.id}`} className={cls}>
      {inner}
    </Link>
  );
}

export function TileSkeletons({ n = 3 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[20px] bg-card ring-1 ring-white/[0.06]">
          <div className="aspect-[5/3] animate-pulse bg-white/[0.04]" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </>
  );
}
