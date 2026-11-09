import { cancel, forgetPlan } from "@/lib/kwop";
import { getUser } from "@/lib/supabase/server";
import { bad, json } from "@/lib/http";

export async function POST() {
  const user = await getUser();
  if (!user?.email) return bad("Sign in first", 401);
  try {
    const r = await cancel(user.email);
    forgetPlan(user.email);
    return json({ message: r.message || "Your subscription is canceled. You keep your plan until the end of the period.", manage_url: r.manage_url ?? null });
  } catch {
    return bad("We couldn't reach billing. Try again in a minute.", 502);
  }
}
