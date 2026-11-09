import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { entitlement } from "@/lib/plans-server";
import { track } from "@/lib/kwop";
import { bad, json, UUID } from "@/lib/http";

export async function GET() {
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  const { data, error } = await supabaseAdmin()
    .from("exports")
    .select("id, sheet_id, sheet_title, format, semitones, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return bad("Could not load your exports. Try again.", 500);
  return json({ exports: data });
}

/** Records a PDF export after checking the plan (the PDF itself is drawn in the browser). */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  const body = await req.json().catch(() => ({}));
  if (!UUID.test(body.sheetId || "")) return bad("Invalid sheet");
  const semis = Math.max(-11, Math.min(11, parseInt(body.semitones, 10) || 0));
  const { tier } = await entitlement(user.email);
  if (!tier) return bad("PDF export is part of every plan", 402);
  if (semis && !tier.keyChanger) return bad("Key Changer is not in your plan", 402);
  const db = supabaseAdmin();
  const { data: sheet } = await db.from("sheets").select("title").eq("id", body.sheetId).eq("user_id", user.id).maybeSingle();
  if (!sheet) return bad("Not found", 404);
  const { data, error } = await db
    .from("exports")
    .insert({ user_id: user.id, sheet_id: body.sheetId, sheet_title: sheet.title, format: "pdf", semitones: semis })
    .select("id")
    .single();
  if (error) return bad("Could not save the export. Try again.", 500);
  track("feature_used", user.email, "Export to PDF");
  return json({ ok: true, id: data.id });
}
