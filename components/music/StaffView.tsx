"use client";
import { useEffect, useRef, useState } from "react";
import type { Note } from "@/lib/music";
import { pcName } from "@/lib/music";

export type ContourNote = { s: number; d: number; y: number };

type Props = {
  notes: Note[];
  contour?: ContourNote[];
  chords?: (string | null)[] | null;
  bars: number;
  flats?: boolean;
  lockedFrom?: number | null; // bar index from which everything is blurred
  showNames?: boolean;
  mode?: "both" | "notes" | "tab";
  barsPerLine?: number; // force (for PDF)
  forExport?: boolean;
  onLockedClick?: () => void;
  id?: string;
};

const LETTER: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const W = 1000;
const STEP = 4.5; // half a staff space
const LIME = "#C8FF3D";

function dia(m: number, flats: boolean) {
  const name = pcName(m, flats);
  return (Math.floor(m / 12) - 1) * 7 + LETTER[name[0]];
}

export function StaffView({
  notes,
  contour = [],
  chords,
  bars,
  flats = false,
  lockedFrom = null,
  showNames = true,
  mode = "both",
  barsPerLine,
  forExport = false,
  onLockedClick,
  id,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [bpl, setBpl] = useState(barsPerLine ?? 2);
  useEffect(() => {
    if (barsPerLine) return;
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBpl(e.contentRect.width < 620 ? 2 : 4));
    ro.observe(el);
    return () => ro.disconnect();
  }, [barsPerLine]);

  // octave shift so the melody sits on the staff (around B4)
  const all = [...notes.map((n) => n.m), ...contour.map((c) => c.y)];
  const med = all.length ? [...all].sort((a, b) => a - b)[Math.floor(all.length / 2)] : 71;
  let shift = 0;
  while (med + shift < 65) shift += 12;
  while (med + shift > 77) shift -= 12;

  const showStaff = mode !== "tab";
  const showTab = mode !== "notes";
  const chordH = 30;
  const above = 46; // room above the staff for ledger lines
  const staffH = 36; // 4 spaces
  const namesH = showNames && showStaff ? 26 : 0;
  const below = showStaff ? 40 : 0;
  const tabGap = 14;
  const tabSp = 11;
  const tabH = showTab ? tabSp * 5 + 12 : 0;
  const sysH = chordH + (showStaff ? above + staffH + below + namesH : 0) + (showTab ? tabGap + tabH : 0) + 22;
  const lines = Math.max(1, Math.ceil(bars / bpl));
  const H = sysH * lines;
  const clefW = 54;

  const ink = forExport ? "#111" : "rgb(244 245 239 / .55)";
  const fg = forExport ? "#111" : "#F4F5EF";
  const noteFill = forExport ? "#111" : LIME;

  const els: React.ReactNode[] = [];
  const lockedEls: React.ReactNode[] = [];

  for (let line = 0; line < lines; line++) {
    const top = line * sysH;
    const staffTop = top + chordH + above;
    const bottomLine = staffTop + staffH; // E4 line
    const tabTop = top + chordH + (showStaff ? above + staffH + below + namesH : 0) + tabGap;
    const x0 = clefW;
    const bw = (W - x0 - 2) / bpl;
    const firstBar = line * bpl;
    const lastBar = Math.min(bars, firstBar + bpl);
    const barsHere = lastBar - firstBar;
    const lineEnd = x0 + bw * barsHere;
    const key = `l${line}`;

    // staff lines
    if (showStaff) {
      for (let i = 0; i < 5; i++)
        els.push(
          <line key={`${key}s${i}`} x1={4} x2={lineEnd} y1={staffTop + i * 9} y2={staffTop + i * 9} stroke={ink} strokeWidth={1} />,
        );
      els.push(
        <text
          key={`${key}clef`}
          x={8}
          y={bottomLine + 9}
          fontSize={52}
          fill={fg}
          style={{ fontFamily: "var(--font-music), 'Noto Music', 'Apple Symbols', 'Segoe UI Symbol', serif" }}
        >
          {"\u{1D11E}"}
        </text>,
      );
    }
    if (showTab) {
      for (let i = 0; i < 6; i++)
        els.push(
          <line key={`${key}t${i}`} x1={4} x2={lineEnd} y1={tabTop + i * tabSp} y2={tabTop + i * tabSp} stroke={ink} strokeWidth={0.9} />,
        );
      ["T", "A", "B"].forEach((c, i) =>
        els.push(
          <text key={`${key}tab${i}`} x={22} y={tabTop + 17 + i * 14} fontSize={13} fontWeight={700} fill={fg} textAnchor="middle" fontFamily="var(--font-jetbrains), monospace">
            {c}
          </text>,
        ),
      );
    }
    // bar lines + chords
    for (let b = firstBar; b <= lastBar; b++) {
      const x = x0 + (b - firstBar) * bw;
      const locked = lockedFrom !== null && b >= lockedFrom && b < lastBar;
      if (showStaff)
        els.push(<line key={`${key}b${b}`} x1={x} x2={x} y1={staffTop} y2={bottomLine} stroke={ink} strokeWidth={b === bars ? 2.5 : 1} />);
      if (showTab)
        els.push(<line key={`${key}tb${b}`} x1={x} x2={x} y1={tabTop} y2={tabTop + tabSp * 5} stroke={ink} strokeWidth={b === bars ? 2.5 : 1} />);
      if (b < lastBar) {
        const ch = chords?.[b];
        const target = locked ? lockedEls : els;
        if (ch)
          target.push(
            <text key={`${key}c${b}`} x={x + 10} y={top + 22} fontSize={17} fontWeight={700} fill={forExport ? "#111" : LIME} fontFamily="var(--font-grotesk), sans-serif">
              {ch}
            </text>,
          );
        else if (locked)
          lockedEls.push(<rect key={`${key}cr${b}`} x={x + 10} y={top + 8} width={34} height={16} rx={5} fill="rgb(200 255 61 / .5)" />);
        els.push(
          <text key={`${key}n${b}`} x={x + 3} y={showStaff ? staffTop - 6 : tabTop - 5} fontSize={10} fill={forExport ? "#777" : "#6b6d64"} fontFamily="var(--font-jetbrains), monospace">
            {b + 1}
          </text>,
        );
      }
    }

    const xOf = (s: number) => {
      const b = Math.floor(s / 16);
      return x0 + (b - firstBar) * bw + 18 + ((s % 16) / 16) * (bw - 30);
    };

    // clear notes
    for (const [i, n] of notes.entries()) {
      const b = Math.floor(n.s / 16);
      if (b < firstBar || b >= lastBar) continue;
      if (lockedFrom !== null && b >= lockedFrom) continue;
      const x = xOf(n.s);
      const k = `${key}n${i}`;
      if (showStaff) {
        const m = n.m + shift;
        const dd = dia(m, flats);
        const y = bottomLine - (dd - 30) * STEP;
        // ledger lines
        for (let l = 28; l >= dd; l -= 2)
          els.push(<line key={`${k}lb${l}`} x1={x - 10} x2={x + 10} y1={bottomLine - (l - 30) * STEP} y2={bottomLine - (l - 30) * STEP} stroke={ink} strokeWidth={1} />);
        for (let l = 40; l <= dd; l += 2)
          els.push(<line key={`${k}la${l}`} x1={x - 10} x2={x + 10} y1={bottomLine - (l - 30) * STEP} y2={bottomLine - (l - 30) * STEP} stroke={ink} strokeWidth={1} />);
        const name = pcName(m, flats);
        if (name.length > 1)
          els.push(
            <text key={`${k}acc`} x={x - 19} y={y + 5} fontSize={15} fill={fg} style={{ fontFamily: "var(--font-music), 'Noto Music', serif" }}>
              {name[1]}
            </text>,
          );
        const hollow = n.d >= 8;
        els.push(
          <ellipse
            key={`${k}h`}
            cx={x}
            cy={y}
            rx={6.2}
            ry={4.6}
            transform={`rotate(-20 ${x} ${y})`}
            fill={hollow ? "none" : noteFill}
            stroke={noteFill}
            strokeWidth={hollow ? 2 : 0}
          />,
        );
        if ([3, 6, 12].includes(n.d)) els.push(<circle key={`${k}dot`} cx={x + 11} cy={y - 2} r={1.8} fill={noteFill} />);
        if (n.d < 16) {
          const up = dd < 34;
          const sx = up ? x + 5.6 : x - 5.6;
          const sy2 = up ? y - 32 : y + 32;
          els.push(<line key={`${k}st`} x1={sx} x2={sx} y1={y} y2={sy2} stroke={noteFill} strokeWidth={1.6} />);
          const flags = n.d === 1 ? 2 : n.d <= 2 ? 1 : 0;
          for (let f = 0; f < flags; f++) {
            const fy = sy2 + (up ? f * 7 : -f * 7);
            els.push(
              <path
                key={`${k}f${f}`}
                d={up ? `M${sx} ${fy} q 2 8 9 12` : `M${sx} ${fy} q 2 -8 9 -12`}
                stroke={noteFill}
                strokeWidth={1.8}
                fill="none"
                strokeLinecap="round"
              />,
            );
          }
        }
        if (showNames)
          els.push(
            <text key={`${k}nm`} x={x} y={bottomLine + below + 12} fontSize={12} textAnchor="middle" fill={forExport ? "#333" : "#cfd1c8"} fontFamily="var(--font-jetbrains), monospace">
              {pcName(n.m, flats)}
            </text>,
          );
      }
      if (showTab && n.str && n.fr !== undefined) {
        const ty = tabTop + (n.str - 1) * tabSp;
        const label = String(n.fr);
        els.push(<rect key={`${k}tr`} x={x - 7 - (label.length - 1) * 3.5} y={ty - 7} width={14 + (label.length - 1) * 7} height={14} fill={forExport ? "#fff" : "#0d0e0b"} />);
        els.push(
          <text key={`${k}tn`} x={x} y={ty + 4.5} fontSize={13} fontWeight={600} textAnchor="middle" fill={fg} fontFamily="var(--font-jetbrains), monospace">
            {label}
          </text>,
        );
      }
    }

    // locked contour (real pitches, rounded) — drawn blurred
    for (const [i, c] of contour.entries()) {
      const b = Math.floor(c.s / 16);
      if (b < firstBar || b >= lastBar) continue;
      const x = xOf(c.s);
      if (showStaff) {
        const y = bottomLine - ((c.y + shift - 64) / 12) * 7 * STEP;
        lockedEls.push(<ellipse key={`${key}k${i}`} cx={x} cy={y} rx={6.2} ry={4.6} fill={LIME} opacity={0.85} />);
        lockedEls.push(<line key={`${key}ks${i}`} x1={x + 5.6} x2={x + 5.6} y1={y} y2={y - 30} stroke={LIME} strokeWidth={1.6} opacity={0.85} />);
      }
      if (showTab) {
        const str = 1 + (i * 7 + c.y) % 4;
        lockedEls.push(<rect key={`${key}kt${i}`} x={x - 6} y={tabTop + (str - 1) * tabSp - 6} width={12} height={12} rx={3} fill="#cfd1c8" opacity={0.7} />);
      }
    }
  }

  return (
    <div ref={wrap} className="relative w-full" id={id}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Sheet music and guitar tab">
        <defs>
          <filter id="mf-blur" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        {els}
        <g filter="url(#mf-blur)">{lockedEls}</g>
      </svg>
      {lockedFrom !== null && onLockedClick && (
        <button type="button" onClick={onLockedClick} aria-label="Unlock the full sheet" className="absolute inset-0 cursor-pointer" />
      )}
    </div>
  );
}
