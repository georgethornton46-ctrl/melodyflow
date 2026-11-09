import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { bad, json } from "@/lib/http";

const KEYS: Record<string, string[]> = {
  view: ["both", "notes", "tab"],
  names: ["on", "off"],
  instrument: ["guitar", "piano", "voice"],
};

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const { data: prof } = await db.from("profiles").select("settings").eq("id", user.id).maybeSingle();
  const settings = { ...((prof?.settings as Record<string, unknown>) || {}) };
  for (const [k, allowed] of Object.entries(KEYS)) if (allowed.includes(body[k])) settings[k] = body[k];
  const patch: Record<string, unknown> = { settings };
  if (typeof body.name === "string") patch.display_name = body.name.replace(/[<>]/g, "").trim().slice(0, 60) || null;
  const { error } = await db.from("profiles").update(patch).eq("id", user.id);
  if (error) return bad("Could not save. Try again.", 500);
  return json({ ok: true, settings });
}
