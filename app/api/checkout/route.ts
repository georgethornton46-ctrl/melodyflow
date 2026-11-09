import { cookies } from "next/headers";
import { createCheckout } from "@/lib/kwop";
import { rankedPlans } from "@/lib/plans-server";
import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { bad, json } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user?.email) return bad("Sign in first", 401);
  const body = await req.json().catch(() => ({}));
  const plan = Number(body.plan);
  const period = body.period === "year" ? "year" : "month";
  let plans;
  try {
    plans = await rankedPlans();
  } catch {
    return bad("Plans are loading. Try again in a moment.", 503);
  }
  const p = plans.find((x) => x.id === plan);
  if (!p) return bad("Unknown plan");
  if (period === "year" && !p.yearly) return bad("This plan has no yearly price");
  const { data: prof } = await supabaseAdmin().from("profiles").select("kwop_k").eq("id", user.id).maybeSingle();
  const ck = (await cookies()).get("kwop_k")?.value;
  const k = prof?.kwop_k || (ck && /^[A-Za-z0-9]{1,12}$/.test(ck) ? ck : null);
  try {
    const r = await createCheckout({ plan, period, email: user.email, k });
    if (r.status === 409) return bad("payments_off", 409);
    if (r.status >= 400 || !r.body.ref) {
      console.error("[checkout] kwop error", r.status, r.body);
      return bad("The checkout could not open. Try again.", 502);
    }
    return json({ embed: r.body.embed ?? null, ref: r.body.ref, fallback_url: r.body.fallback_url ?? null });
  } catch (e) {
    console.error("[checkout] failed", e);
    return bad("The checkout could not open. Try again.", 502);
  }
}
