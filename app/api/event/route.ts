import { track } from "@/lib/kwop";
import { getUser } from "@/lib/supabase/server";
import { json } from "@/lib/http";

const ALLOWED = new Set(["paywall_view", "feature_used"]);
const FEATURES = new Set(["Voice Transcription", "Chord Finder", "Export to PDF", "Key Changer", "MIDI Export", "MusicXML Export", "Compare Takes", "Share"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!ALLOWED.has(body.type)) return json({ ok: false }, 400);
  const detail = body.type === "feature_used" && FEATURES.has(body.detail) ? body.detail : undefined;
  if (body.type === "feature_used" && !detail) return json({ ok: false }, 400);
  const user = await getUser();
  if (user?.email) track(body.type, user.email, detail);
  return json({ ok: true });
}
