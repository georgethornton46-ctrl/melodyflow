import "server-only";
import { context, usedThisPeriod } from "./session";
import { supabaseAdmin } from "./supabase/server";

export async function me(opts: { fresh?: boolean } = {}) {
  const { user, status, tier, rank } = await context(opts);
  if (!user) return null;
  const used = await usedThisPeriod(user.id, status?.until ?? null);
  const { data: prof } = await supabaseAdmin().from("profiles").select("display_name, settings, last_plan").eq("id", user.id).maybeSingle();
  // remember the last known plan (used to detect upgrades)
  const lp = status?.paid && status.plan ? status.plan : null;
  if (JSON.stringify(lp) !== JSON.stringify(prof?.last_plan ?? null) && status?.paid)
    await supabaseAdmin().from("profiles").update({ last_plan: lp }).eq("id", user.id);
  return {
    email: user.email!,
    name: prof?.display_name ?? null,
    provider: (user.app_metadata?.provider as string) || "email",
    settings: (prof?.settings as Record<string, unknown>) || {},
    paid: !!status?.paid && !!tier,
    plan: status?.plan ?? null,
    planStatus: status?.status ?? null,
    until: status?.until ?? null,
    rank,
    tier,
    used,
  };
}
export type Me = NonNullable<Awaited<ReturnType<typeof me>>>;
