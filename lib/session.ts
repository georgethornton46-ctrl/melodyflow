import "server-only";
import { getUser, supabaseAdmin } from "./supabase/server";
import { entitlement, periodStart } from "./plans-server";

export async function context(opts: { fresh?: boolean } = {}) {
  const user = await getUser();
  const ent = await entitlement(user?.email, opts);
  return { user, ...ent };
}

export async function usedThisPeriod(userId: string, until: string | null) {
  const { count } = await supabaseAdmin()
    .from("sheets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart(until).toISOString());
  return count ?? 0;
}
