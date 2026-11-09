import { cancel, confirm, forgetPlan, track } from "@/lib/kwop";
import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { me } from "@/lib/me";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user?.email) return bad("Sign in first", 401);
  const body = await req.json().catch(() => ({}));
  const ref = typeof body.ref === "string" && /^[\w-]{1,100}$/.test(body.ref) ? body.ref : null;
  if (!ref) return bad("Invalid reference");
  const db = supabaseAdmin();
  const { data: prof } = await db.from("profiles").select("last_plan, aha_at").eq("id", user.id).maybeSingle();
  let paid = false;
  try {
    const r = await confirm(ref);
    paid = !!r.paid;
  } catch (e) {
    console.error("[confirm] failed", e);
  }
  forgetPlan(user.email);
  const m = await me({ fresh: true });
  if (m?.paid) {
    // upgrade: stop the old plan at the end of its period — never two plans billed
    const prev = prof?.last_plan as { id: number } | null;
    if (prev && m.plan && prev.id !== m.plan.id) {
      cancel(user.email, ref).catch((e) => console.error("[confirm] cancel old plan failed", e));
    }
    if (!prof?.aha_at) {
      await db.from("profiles").update({ aha_at: new Date().toISOString() }).eq("id", user.id);
      track("aha", user.email);
    }
  }
  return json({ paid: paid || !!m?.paid, me: m });
}
