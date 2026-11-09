import { pcName, usesFlats, type Sheet } from "./music";

// ---------- MIDI (format 0, 480 ticks per quarter) ----------
function vlq(n: number) {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}
export function toMidi(sheet: Sheet): Uint8Array {
  const tpq = 480;
  const per16 = tpq / 4;
  const ev: { t: number; b: number[] }[] = [];
  const us = Math.round(60_000_000 / sheet.bpm);
  ev.push({ t: 0, b: [0xff, 0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff] });
  ev.push({ t: 0, b: [0xff, 0x58, 0x04, 4, 2, 24, 8] });
  for (const n of sheet.notes) {
    ev.push({ t: n.s * per16, b: [0x90, n.m, 90] });
    ev.push({ t: (n.s + n.d) * per16 - 1, b: [0x80, n.m, 0] });
  }
  ev.sort((a, b) => a.t - b.t || (a.b[0] === 0x80 ? -1 : 1));
  const track: number[] = [];
  let last = 0;
  for (const e of ev) {
    track.push(...vlq(e.t - last), ...e.b);
    last = e.t;
  }
  track.push(0, 0xff, 0x2f, 0);
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (tpq >> 8) & 0xff, tpq & 0xff];
  const len = track.length;
  return new Uint8Array([...head, 0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff, ...track]);
}

// ---------- MusicXML (partwise, divisions = 4 per quarter) ----------
const TYPES: Record<number, [string, boolean]> = {
  1: ["16th", false],
  2: ["eighth", false],
  3: ["eighth", true],
  4: ["quarter", false],
  6: ["quarter", true],
  8: ["half", false],
  12: ["half", true],
  16: ["whole", false],
};
function split(d: number): number[] {
  const out: number[] = [];
  for (const v of [16, 12, 8, 6, 4, 3, 2, 1]) while (d >= v) (out.push(v), (d -= v));
  return out;
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function toMusicXml(sheet: Sheet, title: string): string {
  const flats = usesFlats(sheet.key);
  const fifths = (() => {
    const t = sheet.key.mode === "major" ? sheet.key.tonic : (sheet.key.tonic + 3) % 12;
    const map: Record<number, number> = { 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: flats ? -6 : 6, 1: -5, 8: -4, 3: -3, 10: -2, 5: -1 };
    return map[t] ?? 0;
  })();
  const measures: string[] = [];
  for (let b = 0; b < sheet.bars; b++) {
    const items: string[] = [];
    if (b === 0)
      items.push(
        `<attributes><divisions>4</divisions><key><fifths>${fifths}</fifths><mode>${sheet.key.mode}</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`,
        `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${sheet.bpm}</per-minute></metronome></direction-type><sound tempo="${sheet.bpm}"/></direction>`,
      );
    const ch = sheet.chords[b];
    if (ch) {
      const root = ch[0];
      const alter = ch[1] === "♯" ? 1 : ch[1] === "♭" ? -1 : 0;
      const kind = ch.endsWith("dim") ? "diminished" : ch.endsWith("m") ? "minor" : "major";
      items.push(`<harmony><root><root-step>${root}</root-step>${alter ? `<root-alter>${alter}</root-alter>` : ""}</root><kind>${kind}</kind></harmony>`);
    }
    let pos = b * 16;
    const end = (b + 1) * 16;
    const inBar = sheet.notes.filter((n) => n.s >= b * 16 && n.s < end);
    const rest = (d: number) => split(d).map((v) => `<note><rest/><duration>${v}</duration><type>${TYPES[v][0]}</type>${TYPES[v][1] ? "<dot/>" : ""}</note>`).join("");
    for (const n of inBar) {
      if (n.s > pos) items.push(rest(n.s - pos));
      const d = Math.min(n.d, end - n.s);
      const name = pcName(n.m, flats);
      const step = name[0];
      const alter = name[1] === "♯" ? 1 : name[1] === "♭" ? -1 : 0;
      const oct = Math.floor(n.m / 12) - 1;
      const parts = split(d);
      parts.forEach((v, i) => {
        const tie = parts.length > 1 ? (i === 0 ? '<tie type="start"/>' : i === parts.length - 1 ? '<tie type="stop"/>' : '<tie type="stop"/><tie type="start"/>') : "";
        items.push(
          `<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${oct}</octave></pitch><duration>${v}</duration>${tie}<type>${TYPES[v][0]}</type>${TYPES[v][1] ? "<dot/>" : ""}</note>`,
        );
      });
      pos = n.s + d;
    }
    if (pos < end) items.push(rest(end - pos));
    measures.push(`<measure number="${b + 1}">${items.join("")}</measure>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0"><work><work-title>${esc(title)}</work-title></work><identification><encoding><software>MelodyFlow</software></encoding></identification><part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list><part id="P1">${measures.join("")}</part></score-partwise>`;
}
