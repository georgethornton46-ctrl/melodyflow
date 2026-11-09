// Browser-side pitch tracking (YIN). The audio never leaves the device:
// we decode it, resample to 16 kHz mono and send only the pitch curve.

export const SR = 16000;
export const HOP = 160; // 10 ms
const WIN = 512;
const MIN_HZ = 70;
const MAX_HZ = 1000;
const THRESH = 0.15;

export type PitchTrack = {
  hop: number; // seconds per frame
  midi: number[]; // 0 = unvoiced, else MIDI float (2 decimals)
  rms: number[]; // 0..1 (3 decimals)
  duration: number;
  peaks: number[]; // 96 waveform peaks for display (0..1)
};

export async function decodeToMono16k(data: ArrayBuffer): Promise<Float32Array> {
  const AC: typeof AudioContext =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  let buf: AudioBuffer;
  try {
    buf = await ctx.decodeAudioData(data.slice(0));
  } finally {
    ctx.close().catch(() => {});
  }
  return resample(buf);
}

export async function resample(buf: AudioBuffer): Promise<Float32Array> {
  const len = Math.max(1, Math.ceil(buf.duration * SR));
  const off = new OfflineAudioContext(1, len, SR);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  return out.getChannelData(0);
}

function yinFrame(x: Float32Array, start: number, d: Float32Array, tauMin: number, tauMax: number): [number, number] {
  // difference function
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let i = 0; i < WIN; i++) {
      const v = x[start + i] - x[start + i + tau];
      s += v * v;
    }
    d[tau] = s;
  }
  // cumulative mean normalized difference
  d[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    d[tau] = run === 0 ? 1 : (d[tau] * tau) / run;
  }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (d[t] < THRESH) {
      while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return [0, 1];
  // parabolic interpolation
  const a = d[tau - 1] ?? d[tau];
  const b = d[tau];
  const c = d[tau + 1] ?? d[tau];
  const den = a + c - 2 * b;
  const shift = den !== 0 ? (a - c) / (2 * den) : 0;
  return [SR / (tau + shift), b];
}

export async function trackPitch(
  x: Float32Array,
  onProgress?: (p: number) => void,
): Promise<PitchTrack> {
  const tauMin = Math.floor(SR / MAX_HZ);
  const tauMax = Math.ceil(SR / MIN_HZ);
  const need = WIN + tauMax;
  const frames = Math.max(0, Math.floor((x.length - need) / HOP));
  const d = new Float32Array(tauMax + 2);
  const midi: number[] = new Array(frames);
  const rms: number[] = new Array(frames);
  // global level for noise gate
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  const norm = peak > 0 ? 1 / peak : 1;
  let lastYield = performance.now();
  for (let f = 0; f < frames; f++) {
    const start = f * HOP;
    let e = 0;
    for (let i = 0; i < WIN; i++) e += x[start + i] * x[start + i];
    const r = Math.sqrt(e / WIN) * norm;
    rms[f] = Math.round(r * 1000) / 1000;
    if (r < 0.02) {
      midi[f] = 0;
    } else {
      const [hz, ap] = yinFrame(x, start, d, tauMin, tauMax);
      midi[f] = hz > 0 && ap < THRESH ? Math.round((69 + 12 * Math.log2(hz / 440)) * 100) / 100 : 0;
    }
    if (performance.now() - lastYield > 30) {
      onProgress?.(f / frames);
      await new Promise((r) => setTimeout(r, 0));
      lastYield = performance.now();
    }
  }
  return { hop: HOP / SR, midi, rms, duration: x.length / SR, peaks: waveformPeaks(x, 96) };
}

export function waveformPeaks(x: Float32Array, n: number): number[] {
  const out: number[] = [];
  const step = Math.max(1, Math.floor(x.length / n));
  let max = 0;
  for (let i = 0; i < n; i++) {
    let p = 0;
    for (let j = i * step; j < Math.min(x.length, (i + 1) * step); j++) p = Math.max(p, Math.abs(x[j]));
    out.push(p);
    max = Math.max(max, p);
  }
  return out.map((p) => Math.round((max ? p / max : 0) * 100) / 100);
}

// A short "hummed" example melody, synthesized in the browser and analysed
// by the exact same pipeline as a real recording.
export async function exampleHum(): Promise<Float32Array> {
  // [midi, beats] at 100 BPM — an original 4-bar tune in C major
  const tune: [number, number][] = [
    [64, 1], [67, 1], [69, 1], [67, 1],
    [72, 1.5], [71, 0.5], [69, 1], [67, 1],
    [65, 1], [69, 1], [67, 1], [64, 1],
    [62, 1], [64, 0.5], [65, 0.5], [67, 2],
    [69, 1], [67, 1], [65, 1], [64, 1],
    [62, 1], [64, 1], [60, 2],
  ];
  const bpm = 100;
  const beat = 60 / bpm;
  const total = tune.reduce((s, [, b]) => s + b, 0) * beat + 0.4;
  const off = new OfflineAudioContext(1, Math.ceil(total * SR), SR);
  let t = 0.2;
  for (const [m, b] of tune) {
    const hz = 440 * Math.pow(2, (m - 69) / 12);
    const dur = b * beat;
    for (const [mult, amp, type] of [
      [1, 0.5, "triangle"],
      [2, 0.12, "sine"],
    ] as const) {
      const o = off.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(hz * mult, t);
      // a little vibrato, like a real voice
      const lfo = off.createOscillator();
      const lg = off.createGain();
      lfo.frequency.value = 5.2;
      lg.gain.value = hz * mult * 0.006;
      lfo.connect(lg).connect(o.frequency);
      const g = off.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.04);
      g.gain.setValueAtTime(amp * 0.85, t + dur - 0.09);
      g.gain.linearRampToValueAtTime(0, t + dur - 0.02);
      o.connect(g).connect(off.destination);
      o.start(t);
      o.stop(t + dur);
      lfo.start(t);
      lfo.stop(t + dur);
    }
    t += dur;
  }
  const out = await off.startRendering();
  return out.getChannelData(0);
}
