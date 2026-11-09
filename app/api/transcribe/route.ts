import { analyse } from "@/lib/music";
import { FREE, TIERS } from "@/lib/plans";
import { rankedPlans } from "@/lib/plans-server";
import { context, usedThisPeriod } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { toView, type SheetRow } from "@/lib/sheet-view";
import { track } from "@/lib/kwop";
import { bad, ipHash, json } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 30;

const isNum = (x: unknown) => typeof x === "number" && Number.isFinite(x);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request");
  }
  const { deviceId, midi, rms, hop, duration, peaks, title, source } = body as {
    deviceId: string;
    midi: number[];
    rms: number[];
    hop: number;
    duration: number;
    peaks: number[];
    title?: string;
    source?: string;
  };
  if (typeof deviceId !== "string" || deviceId.length > 64 || deviceId.length < 8) return bad("Invalid device");
  if (!Array.isArray(midi) || !Array.isArray(rms) || midi.length !== rms.length || midi.length > 31000)
    return bad("Invalid pitch data");
  if (!isNum(hop) || hop < 0.005 || hop > 0.05 || !isNum(duration) || duration <= 0) return bad("Invalid timing");
  if (!midi.every((v) => isNum(v) && v >= 0 && v < 128) || !rms.every((v) => isNum(v) && v >= 0 && v <= 2))
    return bad("Invalid pitch data");
  const wave = Array.isArray(peaks) ? peaks.slice(0, 128).map((p) => (isNum(p) ? Math.max(0, Math.min(1, p)) : 0)) : [];

  const { user, status, tier } = await context();
  const db = supabaseAdmin();
  const ip = ipHash(req);
  const maxSeconds = tier?.maxSeconds ?? FREE.maxSeconds;
  if (duration > maxSeconds + 1.5) {
    const next = TIERS.find((t) => t.maxSeconds > maxSeconds);
    return bad("too_long", 413, { maxSeconds, nextSeconds: next?.maxSeconds ?? null });
  }

  if (!tier) {
    // free tries: 3 a day per device and per IP (and per account)
    const since = new Date(Date.now() - 86400_000).toISOString();
    const counts = await Promise.all([
      db.from("sheets").select("id", { count: "exact", head: true }).eq("device_id", deviceId).gte("created_at", since),
      db.from("sheets").select("id", { count: "exact", head: true }).eq("ip_hash", ip).gte("created_at", since),
      user
        ? db.from("sheets").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since)
        : Promise.resolve({ count: 0 }),
    ]);
    if (counts.some((c) => (c.count ?? 0) >= FREE.triesPerDay)) return bad("daily_limit", 429, { limit: FREE.triesPerDay });
  } else if (user) {
    const used = await usedThisPeriod(user.id, status?.until ?? null);
    if (used >= tier.sheetsPerMonth) {
      let next: { name: string; id: number } | null = null;
      try {
        const plans = await rankedPlans();
        const p = plans[tier.rank + 1];
        if (p) next = { name: p.name, id: p.id };
      } catch {}
      return bad("quota", 402, { limit: tier.sheetsPerMonth, next });
    }
  }

  const sheet = analyse(midi, rms, hop);
  if (!sheet) return bad("no_melody", 422);

  const cleanTitle = (typeof title === "string" ? title : "").replace(/[<>]/g, "").trim().slice(0, 80) || "Untitled melody";
  const { data, error } = await db
    .from("sheets")
    .insert({
      user_id: user?.id ?? null,
      device_id: deviceId,
      ip_hash: ip,
      title: cleanTitle,
      data: sheet,
      waveform: wave,
      duration: Math.round(duration * 10) / 10,
      source: source === "upload" || source === "example" ? source : "record",
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("[transcribe] insert failed", error);
    return bad("Could not save your song sheet. Try again.", 500);
  }
  if (user?.email) {
    track("onboarding_done", user.email);
    track("feature_used", user.email, "Voice Transcription");
  }
  return json({ sheet: toView(data as SheetRow, !!tier) });
}
