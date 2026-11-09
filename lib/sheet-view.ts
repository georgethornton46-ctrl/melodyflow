import { insight, type Note, type Sheet } from "./music";
import { FREE } from "./plans";

export type SheetRow = {
  id: string;
  user_id: string | null;
  title: string;
  data: Sheet;
  waveform: number[];
  duration: number;
  source: string;
  public: boolean;
  created_at: string;
};

export type SheetView = {
  id: string;
  title: string;
  createdAt: string;
  duration: number;
  source: string;
  waveform: number[];
  bpm: number;
  bars: number;
  noteCount: number;
  range: [number, number];
  insight: string;
  confidence: number;
  locked: boolean;
  clearBars: number;
  notes: Note[];
  contour: { s: number; d: number; y: number }[];
  key: Sheet["key"] | null;
  chords: string[] | null;
  isPublic: boolean;
};

/** What the browser may see. Locked = bars 1–2 in clear, the rest as a coarse contour, no key, no chords. */
export function toView(row: SheetRow, unlocked: boolean): SheetView {
  const d = row.data;
  const clearBars = unlocked ? d.bars : Math.min(FREE.clearBars, d.bars);
  const limit = clearBars * 16;
  const base = {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    duration: row.duration,
    source: row.source,
    waveform: row.waveform,
    bpm: d.bpm,
    bars: d.bars,
    noteCount: d.notes.length,
    range: d.range,
    insight: insight(d),
    confidence: d.confidence,
    isPublic: row.public,
  };
  if (unlocked)
    return { ...base, locked: false, clearBars, notes: d.notes, contour: [], key: d.key, chords: d.chords };
  return {
    ...base,
    locked: true,
    clearBars,
    notes: d.notes.filter((n) => n.s < limit),
    // real pitches, rounded to the nearest 3 semitones: the shape, not the notes
    contour: d.notes.filter((n) => n.s >= limit).map((n) => ({ s: n.s, d: n.d, y: Math.round(n.m / 3) * 3 })),
    key: null,
    chords: null,
  };
}
