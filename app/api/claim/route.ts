import { cookies } from "next/headers";
import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { track } from "@/lib/kwop";
import { bad, json } from "@/lib/http";

/** Called right after sign-up / log-in: attaches tries made before the account, saves k / plan / utm. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return bad("Not signed in", 401);
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" && body.deviceId.length <= 64 ? body.deviceId : null;
  const db = supabaseAdmin();
  let claimed = 0;
  if (deviceId) {
    const { data } = await db.from("sheets").update({ user_id: user.id }).eq("device_id", deviceId).is("user_id", null).select("id");
    claimed = data?.length ?? 0;
  }
  const store = await cookies();
  const k = store.get("kwop_k")?.value;
  const plan = store.get("mf_plan")?.value;
  let src: Record<string, string> = {};
  try {
    src = JSON.parse(store.get("mf_src")?.value || "{}");
  } catch {}
  const { data: prof } = await db.from("profiles").select("kwop_k, intended_plan, source, settings").eq("id", user.id).maybeSingle();
  const patch: Record<string, unknown> = { id: user.id, email: user.email };
  if (k && /^[A-Za-z0-9]{1,12}$/.test(k) && !prof?.kwop_k) patch.kwop_k = k;
  if (plan && !prof?.intended_plan) patch.intended_plan = plan.slice(0, 40);
  if (Object.keys(src).length && !(prof?.source && Object.keys(prof.source).length)) patch.source = src;
  // a brand-new account (email or Google): track "signup" once
  const settings = (prof?.settings as Record<string, unknown>) || {};
  const isNew = !settings.signup_tracked && Date.now() - new Date(user.created_at).getTime() < 10 * 60_000;
  if (isNew) patch.settings = { ...settings, signup_tracked: true };
  await db.from("profiles").upsert(patch, { onConflict: "id" });
  if (isNew) track("signup", user.email);
  if (claimed && user.email) track("onboarding_done", user.email);
  return json({ ok: true, claimed });
}
