import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { entitlement } from "@/lib/plans-server";
import { toView, type SheetRow } from "@/lib/sheet-view";
import { bad, json } from "@/lib/http";

export async function GET() {
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  const { tier } = await entitlement(user.email);
  let q = supabaseAdmin().from("sheets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
  if (tier?.historyDays) q = q.gte("created_at", new Date(Date.now() - tier.historyDays * 86400_000).toISOString());
  const { data, error } = await q;
  if (error) return bad("Could not load your sheets. Try again.", 500);
  return json({ sheets: (data as SheetRow[]).map((r) => toView(r, !!tier)) });
}
