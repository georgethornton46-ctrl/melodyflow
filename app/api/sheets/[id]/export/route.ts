import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { entitlement } from "@/lib/plans-server";
import { transposeSheet, type Sheet } from "@/lib/music";
import { toMidi, toMusicXml } from "@/lib/formats";
import { track } from "@/lib/kwop";
import { bad, UUID } from "@/lib/http";

/** MIDI / MusicXML (Studio). PDF is drawn in the browser and recorded via /api/exports. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const semis = Math.max(-11, Math.min(11, parseInt(url.searchParams.get("semitones") || "0", 10) || 0));
  if (!UUID.test(id) || (format !== "midi" && format !== "musicxml")) return bad("Not found", 404);
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  const { tier } = await entitlement(user.email);
  if (!tier?.midi) return bad("MIDI and MusicXML export are part of Studio", 402);
  if (semis && !tier.keyChanger) return bad("Key Changer is not in your plan", 402);
  const db = supabaseAdmin();
  const { data } = await db.from("sheets").select("title, data").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) return bad("Not found", 404);
  const sheet = transposeSheet(data.data as Sheet, semis);
  await db.from("exports").insert({ user_id: user.id, sheet_id: id, sheet_title: data.title, format, semitones: semis });
  track("feature_used", user.email, format === "midi" ? "MIDI Export" : "MusicXML Export");
  const safe = (data.title as string).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "melody";
  if (format === "midi")
    return new Response(Buffer.from(toMidi(sheet)), {
      headers: { "Content-Type": "audio/midi", "Content-Disposition": `attachment; filename="${safe}.mid"` },
    });
  return new Response(toMusicXml(sheet, data.title as string), {
    headers: { "Content-Type": "application/vnd.recordare.musicxml+xml", "Content-Disposition": `attachment; filename="${safe}.musicxml"` },
  });
}
