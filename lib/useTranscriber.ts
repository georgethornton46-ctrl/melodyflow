"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { decodeToMono16k, exampleHum, resample, trackPitch, SR } from "./pitch";
import { deviceId } from "./device";
import type { SheetView } from "./types";

export type Phase = "idle" | "recording" | "working" | "ready" | "done" | "error";
export const STEPS = [
  "Listening to your take",
  "Finding every pitch",
  "Locking the tempo",
  "Detecting the key",
  "Matching the chords",
  "Writing notes & tab",
];

export type TxError = {
  code: "mic" | "decode" | "no_melody" | "daily_limit" | "quota" | "too_long" | "network" | "server" | "short";
  message: string;
  extra?: Record<string, unknown>;
};

function defaultTitle() {
  const d = new Date();
  return `Melody · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export function useTranscriber({ maxSeconds, onSheet }: { maxSeconds: number; onSheet?: (s: SheetView) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState<number[]>(new Array(48).fill(0));
  const [pct, setPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [curve, setCurve] = useState<number[]>([]);
  const [sheet, setSheet] = useState<SheetView | null>(null);
  const [error, setError] = useState<TxError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rec = useRef<{
    ctx: AudioContext;
    stream: MediaStream;
    proc: ScriptProcessorNode;
    chunks: Float32Array[];
    t0: number;
    raf: number;
    timer: number;
  } | null>(null);
  const pctTarget = useRef(0);
  const maxRef = useRef(maxSeconds);
  maxRef.current = maxSeconds;

  // smooth percentage toward its target, never past 99 until done
  useEffect(() => {
    if (phase !== "working") return;
    const id = window.setInterval(() => {
      setPct((p) => {
        const target = Math.min(99, pctTarget.current);
        if (p >= target) return Math.min(99, p + (target >= 99 ? 0 : 0.05));
        return Math.min(target, p + Math.max(0.6, (target - p) * 0.12));
      });
    }, 40);
    return () => clearInterval(id);
  }, [phase]);

  const cleanupRec = () => {
    const r = rec.current;
    if (!r) return;
    cancelAnimationFrame(r.raf);
    clearInterval(r.timer);
    try {
      r.proc.disconnect();
    } catch {}
    r.stream.getTracks().forEach((t) => t.stop());
    r.ctx.close().catch(() => {});
    rec.current = null;
  };
  useEffect(() => () => cleanupRec(), []);

  const process = useCallback(
    async (getAudio: () => Promise<Float32Array>, source: "record" | "upload" | "example", title?: string) => {
      setError(null);
      setNotice(null);
      setSheet(null);
      setPhase("working");
      setPct(0);
      setStepIdx(0);
      setCurve([]);
      pctTarget.current = 8;
      const t0 = performance.now();
      const fail = (e: TxError) => {
        setError(e);
        setPhase("error");
      };
      let x: Float32Array;
      try {
        x = await getAudio();
      } catch (e) {
        if ((e as Error).message === "mic") return;
        return fail({ code: "decode", message: "We couldn't read this file. Try an audio file like a voice memo (.m4a), .mp3 or .wav." });
      }
      const max = maxRef.current;
      if (x.length / SR > max + 0.5) {
        x = x.subarray(0, Math.floor(max * SR));
        setNotice(`We used the first ${max} seconds of your take.`);
      }
      if (x.length / SR < 1.2) return fail({ code: "short", message: "That take was too short. Hum for at least 2 seconds." });
      setStepIdx(1);
      pctTarget.current = 12;
      const track = await trackPitch(x, (p) => {
        pctTarget.current = 12 + p * 48;
      });
      setCurve(track.midi);
      setStepIdx(2);
      pctTarget.current = 64;
      // tick the server-side steps while the server works
      const ticks = [3, 4].map((s, i) =>
        window.setTimeout(() => {
          setStepIdx((cur) => Math.max(cur, s));
          pctTarget.current = 74 + i * 12;
        }, 550 + i * 550),
      );
      const send = async () =>
        fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: deviceId(),
            midi: track.midi,
            rms: track.rms,
            hop: track.hop,
            duration: track.duration,
            peaks: track.peaks,
            title: title || defaultTitle(),
            source,
          }),
        });
      let r: Response;
      try {
        r = await send();
        if (r.status >= 500) r = await send(); // retry once
      } catch {
        try {
          r = await send();
        } catch {
          ticks.forEach(clearTimeout);
          return fail({ code: "network", message: "We lost the connection. Check your internet and try again." });
        }
      }
      const j = await r.json().catch(() => ({}));
      ticks.forEach(clearTimeout);
      if (!r.ok) {
        const map: Record<string, TxError> = {
          no_melody: { code: "no_melody", message: "We couldn't hear a clear melody. Hum a little louder, one note at a time, in a quiet room." },
          daily_limit: { code: "daily_limit", message: "You've used your 3 free song sheets for today." },
          quota: { code: "quota", message: "You've used all your song sheets for this month.", extra: j },
          too_long: { code: "too_long", message: `Your plan reads takes up to ${j.maxSeconds} seconds.`, extra: j },
        };
        return fail(map[j.error] || { code: "server", message: "Something went wrong on our side. Try again." });
      }
      setStepIdx(5);
      pctTarget.current = 99;
      const wait = Math.max(0, 3000 - (performance.now() - t0));
      await new Promise((res) => setTimeout(res, wait + 350));
      setStepIdx(6);
      setPct(100);
      setPhase("ready");
      setSheet(j.sheet);
      await new Promise((res) => setTimeout(res, 1100));
      setPhase("done");
      onSheet?.(j.sheet);
    },
    [onSheet],
  );

  const stopRecording = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    const chunks = r.chunks;
    const rate = r.ctx.sampleRate;
    cleanupRec();
    const total = chunks.reduce((s, c) => s + c.length, 0);
    process(async () => {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const tmp = new AC();
      const buf = tmp.createBuffer(1, Math.max(1, total), rate);
      const ch = buf.getChannelData(0);
      let o = 0;
      for (const c of chunks) {
        ch.set(c, o);
        o += c.length;
      }
      tmp.close().catch(() => {});
      return resample(buf);
    }, "record");
  }, [process]);

  const startRecording = useCallback(async () => {
    setError(null);
    setNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      proc.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      src.connect(an);
      src.connect(proc);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      proc.connect(mute).connect(ctx.destination);
      const data = new Uint8Array(an.fftSize);
      const t0 = performance.now();
      const state = { ctx, stream, proc, chunks, t0, raf: 0, timer: 0 };
      rec.current = state;
      const hist: number[] = new Array(48).fill(0);
      const loop = () => {
        an.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
        hist.push(Math.min(1, peak * 2.2));
        hist.shift();
        setLevel([...hist]);
        state.raf = requestAnimationFrame(loop);
      };
      state.raf = requestAnimationFrame(loop);
      state.timer = window.setInterval(() => {
        const s = (performance.now() - t0) / 1000;
        setElapsed(s);
        if (s >= maxRef.current) stopRecording();
      }, 100);
      setElapsed(0);
      setPhase("recording");
    } catch {
      setError({
        code: "mic",
        message: "MelodyFlow needs your microphone to hear your melody. Allow it in your browser, or upload a voice memo instead.",
      });
      setPhase("error");
    }
  }, [stopRecording]);

  const upload = useCallback(
    (file: File) => {
      if (file.size > 40 * 1024 * 1024) {
        setError({ code: "decode", message: "This file is too big. Trim it to the melody and try again (max 40 MB)." });
        setPhase("error");
        return;
      }
      const title = file.name.replace(/\.[^.]+$/, "").slice(0, 80);
      process(async () => decodeToMono16k(await file.arrayBuffer()), "upload", title);
    },
    [process],
  );

  const example = useCallback(() => process(() => exampleHum(), "example", "Example hum · Sunday morning"), [process]);

  const reset = useCallback(() => {
    cleanupRec();
    setPhase("idle");
    setError(null);
    setSheet(null);
    setNotice(null);
  }, []);

  return {
    phase,
    elapsed,
    level,
    pct,
    stepIdx,
    curve,
    sheet,
    setSheet,
    error,
    notice,
    startRecording,
    stopRecording,
    upload,
    example,
    reset,
    setPhase,
  };
}
