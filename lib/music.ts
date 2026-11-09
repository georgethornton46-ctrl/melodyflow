// Pure music analysis: pitch curve → notes → tempo → key → chords → tab.
// Runs on the server (/api/transcribe) and is shared with the client for
// display helpers (spelling, transposition).

export type Note = {
  m: number; // MIDI note number
  s: number; // start, in 16ths from the start of the sheet
  d: number; // duration, in 16ths
  str?: number; // guitar string 1 (high e) .. 6 (low E)
  fr?: number; // fret
};

export type Sheet = {
  bpm: number;
  bars: number;
  notes: Note[];
  key: { tonic: number; mode: "major" | "minor" }; // tonic pitch class 0..11
  chords: string[]; // one per bar
  range: [number, number];
  confidence: number; // 0..1
};

const NAMES_SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const NAMES_FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
// keys (by tonic pc) that use flats
const FLAT_MAJOR = new Set([5, 10, 3, 8, 1, 6]);
const FLAT_MINOR = new Set([2, 7, 0, 5, 10, 3]);

export function usesFlats(key: Sheet["key"]) {
  return key.mode === "major" ? FLAT_MAJOR.has(key.tonic) : FLAT_MINOR.has(key.tonic);
}
export function pcName(pc: number, flats: boolean) {
  return (flats ? NAMES_FLAT : NAMES_SHARP)[((pc % 12) + 12) % 12];
}
export function noteName(m: number, flats: boolean, octave = true) {
  return pcName(m, flats) + (octave ? String(Math.floor(m / 12) - 1) : "");
}
export function keyName(key: Sheet["key"]) {
  return `${pcName(key.tonic, usesFlats(key))} ${key.mode}`;
}

// ---------- 1. pitch curve → raw notes (seconds) ----------
type RawNote = { m: number; t: number; dur: number };

function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

export function segment(midi: number[], rms: number[], hop: number): RawNote[] {
  const n = midi.length;
  // median filter on voiced frames
  const f = midi.map((v, i) => {
    if (!v) return 0;
    const w: number[] = [];
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) if (midi[j]) w.push(midi[j]);
    return w.length >= 3 ? median(w) : 0;
  });
  // global tuning offset (people rarely hum at A=440)
  let sx = 0,
    sy = 0;
  for (const v of f)
    if (v) {
      const a = 2 * Math.PI * (v - Math.round(v));
      sx += Math.cos(a);
      sy += Math.sin(a);
    }
  const offset = Math.atan2(sy, sx) / (2 * Math.PI);
  const g = f.map((v) => (v ? v - offset : 0));

  const notes: RawNote[] = [];
  let cur: { start: number; vals: number[]; gap: number } | null = null;
  const close = (end: number) => {
    if (!cur) return;
    const len = end - cur.start;
    if (len * hop >= 0.07) notes.push({ m: Math.round(median(cur.vals)), t: cur.start * hop, dur: len * hop });
    cur = null;
  };
  for (let i = 0; i < n; i++) {
    const v = g[i];
    if (!v) {
      if (cur) {
        cur.gap++;
        if (cur.gap >= 4) close(i - cur.gap + 1);
      }
      continue;
    }
    if (!cur) {
      cur = { start: i, vals: [v], gap: 0 };
      continue;
    }
    const ref = median(cur.vals.slice(-12));
    // a sustained move of more than ~0.7 semitone = a new note
    const jump = Math.abs(v - ref) > 0.7;
    const sustained = jump && i + 2 < n && g[i + 1] && g[i + 2] && Math.abs(g[i + 2] - ref) > 0.7;
    // re-articulation on the same pitch: loudness dip then rise
    const reattack =
      i > 3 && rms[i] > 1.8 * Math.min(rms[i - 1], rms[i - 2], rms[i - 3]) && rms[i - 2] < 0.12 && cur.vals.length > 8;
    if ((jump && sustained) || reattack) {
      close(i - cur.gap);
      cur = { start: i, vals: [v], gap: 0 };
    } else {
      cur.vals.push(v);
      cur.gap = 0;
    }
  }
  if (cur) close(n - (cur as { gap: number }).gap);
  // merge tiny pitch glitches into neighbours
  return notes.filter((x, i) => !(x.dur < 0.09 && notes[i - 1] && Math.abs(notes[i - 1].m - x.m) > 4));
}

// ---------- 2. tempo + quantization ----------
export function estimateTempo(onsets: number[]): { bpm: number; fit: number } {
  if (onsets.length < 3) return { bpm: 100, fit: 0.5 };
  const t0 = onsets[0];
  let best = { bpm: 100, score: -Infinity, fit: 0 };
  for (let bpm = 60; bpm <= 160; bpm++) {
    const eighth = 60 / bpm / 2;
    const sigma = eighth * 0.18;
    let s = 0;
    for (const o of onsets) {
      const x = (o - t0) / eighth;
      const dist = (x - Math.round(x)) * eighth;
      s += Math.exp(-(dist * dist) / (2 * sigma * sigma));
    }
    const fit = s / onsets.length;
    // gentle prior toward 80–120 BPM (most hummed songs)
    const prior = Math.exp(-Math.pow((bpm - 100) / 45, 2)) * 0.15;
    const score = fit + prior;
    if (score > best.score) best = { bpm, score, fit };
  }
  return { bpm: best.bpm, fit: best.fit };
}

export function quantize(raw: RawNote[], bpm: number): Note[] {
  if (!raw.length) return [];
  const six = 60 / bpm / 4;
  const t0 = raw[0].t;
  const out: Note[] = [];
  for (const r of raw) {
    const s = Math.round((r.t - t0) / six);
    let d = Math.max(1, Math.round(r.dur / six));
    const prev = out[out.length - 1];
    if (prev && s <= prev.s) {
      if (prev.m === r.m) {
        prev.d = Math.max(prev.d, s + d - prev.s);
        continue;
      }
      continue;
    }
    if (prev && prev.s + prev.d > s) prev.d = Math.max(1, s - prev.s);
    out.push({ m: r.m, s, d: Math.min(d, 16) });
  }
  // legato: a short breath between two notes belongs to the first note
  for (let i = 0; i < out.length - 1; i++) {
    const gap = out[i + 1].s - (out[i].s + out[i].d);
    if (gap > 0 && gap <= 2 && gap < out[i].d) out[i].d += gap;
  }
  return out;
}

// ---------- 3. key (Krumhansl–Schmuckler) ----------
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function corr(a: number[], b: number[]) {
  const ma = a.reduce((s, x) => s + x, 0) / 12;
  const mb = b.reduce((s, x) => s + x, 0) / 12;
  let n = 0,
    da = 0,
    db = 0;
  for (let i = 0; i < 12; i++) {
    n += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? n / Math.sqrt(da * db) : 0;
}

export function detectKey(notes: Note[]): { key: Sheet["key"]; score: number } {
  const h = new Array(12).fill(0);
  for (const n of notes) h[n.m % 12] += n.d;
  // the last note and the first note weigh a bit more (melodies end on the tonic)
  if (notes.length) {
    h[notes[notes.length - 1].m % 12] += 4;
    h[notes[0].m % 12] += 1;
  }
  let best = { key: { tonic: 0, mode: "major" as "major" | "minor" }, score: -2 };
  for (let t = 0; t < 12; t++) {
    const rot = (p: number[]) => p.map((_, i) => p[(i - t + 12) % 12]);
    const cm = corr(h, rot(MAJ));
    const cn = corr(h, rot(MIN));
    if (cm > best.score) best = { key: { tonic: t, mode: "major" }, score: cm };
    if (cn > best.score) best = { key: { tonic: t, mode: "minor" }, score: cn };
  }
  return best;
}

// ---------- 4. chords ----------
type Chord = { root: number; q: "" | "m" | "dim"; prior: number };
function diatonic(key: Sheet["key"]): Chord[] {
  const t = key.tonic;
  if (key.mode === "major")
    return [
      { root: t, q: "", prior: 1.0 },
      { root: t + 2, q: "m", prior: 0.55 },
      { root: t + 4, q: "m", prior: 0.4 },
      { root: t + 5, q: "", prior: 0.85 },
      { root: t + 7, q: "", prior: 0.9 },
      { root: t + 9, q: "m", prior: 0.7 },
    ];
  return [
    { root: t, q: "m", prior: 1.0 },
    { root: t + 3, q: "", prior: 0.75 },
    { root: t + 5, q: "m", prior: 0.7 },
    { root: t + 7, q: "", prior: 0.6 },
    { root: t + 7, q: "m", prior: 0.45 },
    { root: t + 8, q: "", prior: 0.75 },
    { root: t + 10, q: "", prior: 0.75 },
  ];
}
function tones(c: Chord) {
  const third = c.q === "" ? 4 : 3;
  const fifth = c.q === "dim" ? 6 : 7;
  return [c.root % 12, (c.root + third) % 12, (c.root + fifth) % 12];
}
export function chordName(root: number, q: string, flats: boolean) {
  return pcName(root, flats) + q;
}

export function detectChords(notes: Note[], bars: number, key: Sheet["key"]): string[] {
  const flats = usesFlats(key);
  const cands = diatonic(key);
  const out: string[] = [];
  let prev = -1;
  for (let b = 0; b < bars; b++) {
    const inBar = notes.filter((n) => n.s < (b + 1) * 16 && n.s + n.d > b * 16);
    if (!inBar.length) {
      out.push(out[out.length - 1] ?? chordName(cands[0].root, cands[0].q, flats));
      continue;
    }
    let best = 0,
      bestScore = -Infinity;
    cands.forEach((c, i) => {
      const tn = tones(c);
      let s = 0;
      for (const n of inBar) {
        const overlap = Math.min(n.s + n.d, (b + 1) * 16) - Math.max(n.s, b * 16);
        const strong = n.s % 4 === 0 ? 1.4 : 1;
        if (tn.includes(n.m % 12)) s += overlap * strong * (n.m % 12 === tn[0] ? 1.15 : 1);
        else s -= overlap * 0.6;
      }
      s += c.prior * 2;
      if (b === 0 && i === 0) s += 2;
      if (b === bars - 1 && i === 0) s += 2;
      if (i === prev) s += 0.5;
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    });
    prev = best;
    out.push(chordName(cands[best].root, cands[best].q, flats));
  }
  return out;
}

// ---------- 5. guitar tab ----------
const STRINGS = [64, 59, 55, 50, 45, 40]; // string 1 (high e) .. 6 (low E)

export function fitForGuitar(notes: Note[]): Note[] {
  if (!notes.length) return notes;
  // move the melody by octaves so it sits in the guitar's sweet spot
  const med = median(notes.map((n) => n.m));
  let shift = 0;
  while (med + shift > 76) shift -= 12;
  while (med + shift < 57) shift += 12;
  let hand = 3;
  return notes.map((n) => {
    const m = n.m + shift;
    let best: { str: number; fr: number; cost: number } | null = null;
    STRINGS.forEach((open, i) => {
      const fr = m - open;
      if (fr < 0 || fr > 17) return;
      const cost = Math.abs(fr - hand) + (fr > 12 ? 3 : 0) + (fr === 0 ? -0.5 : 0) + i * 0.15;
      if (!best || cost < best.cost) best = { str: i + 1, fr, cost };
    });
    if (!best) return { ...n };
    const b = best as { str: number; fr: number };
    if (b.fr > 0) hand = hand * 0.4 + b.fr * 0.6;
    return { ...n, str: b.str, fr: b.fr };
  });
}

// ---------- the whole pipeline ----------
export function analyse(midi: number[], rms: number[], hop: number): Sheet | null {
  const raw = segment(midi, rms, hop);
  if (raw.length < 3) return null;
  const { bpm, fit } = estimateTempo(raw.map((r) => r.t));
  let notes = quantize(raw, bpm);
  if (notes.length < 3) return null;
  const { key, score } = detectKey(notes);
  const end = notes[notes.length - 1].s + notes[notes.length - 1].d;
  const bars = Math.max(1, Math.ceil(end / 16));
  const chords = detectChords(notes, bars, key);
  notes = fitForGuitar(notes);
  const ms = notes.map((n) => n.m);
  return {
    bpm,
    bars,
    notes,
    key,
    chords,
    range: [Math.min(...ms), Math.max(...ms)],
    confidence: Math.round(Math.max(0, Math.min(1, fit * 0.6 + Math.max(0, score) * 0.4)) * 100) / 100,
  };
}

// ---------- key changer ----------
export function transposeSheet(sheet: Sheet, semis: number): Sheet {
  if (!semis) return sheet;
  const key = { tonic: (((sheet.key.tonic + semis) % 12) + 12) % 12, mode: sheet.key.mode };
  const notes = fitForGuitar(sheet.notes.map((n) => ({ m: n.m + semis, s: n.s, d: n.d })));
  return {
    ...sheet,
    key,
    notes,
    chords: detectChords(notes, sheet.bars, key),
    range: [sheet.range[0] + semis, sheet.range[1] + semis],
  };
}

export function capoHint(sheet: Sheet): string | null {
  // easy open-chord keys for guitar
  const easy = sheet.key.mode === "major" ? [7, 2, 0, 9, 4] : [9, 4, 2];
  if (easy.includes(sheet.key.tonic)) return null;
  for (let capo = 1; capo <= 7; capo++) {
    const shape = (((sheet.key.tonic - capo) % 12) + 12) % 12;
    if (easy.includes(shape))
      return `Capo ${capo}, play ${pcName(shape, false)}${sheet.key.mode === "minor" ? "m" : ""} shapes`;
  }
  return null;
}

// a short, kind, true insight about the melody
export function insight(sheet: Pick<Sheet, "range" | "notes" | "bpm">): string {
  const span = sheet.range[1] - sheet.range[0];
  if (span <= 7) return `Your melody spans ${span} semitones. Easy to sing for almost any voice.`;
  if (span <= 12) return `Your melody spans ${span} semitones, about one octave. Comfortable for most voices.`;
  return `Your melody spans ${span} semitones. That's a big range, so it'll stand out in a chorus.`;
}
