import "server-only";
import { getApp, getPlan, type KwopPlan, type PlanStatus } from "./kwop";
import { tierForRank, type Tier } from "./plans";

export async function rankedPlans(): Promise<KwopPlan[]> {
  const app = await getApp();
  return [...app.plans].sort((a, b) => a.price_cents - b.price_cents);
}

export async function entitlement(email: string | null | undefined, opts: { fresh?: boolean } = {}) {
  if (!email) return { status: null as PlanStatus | null, tier: null as Tier | null, rank: -1 };
  const status = await getPlan(email, opts);
  if (!status.paid || !status.plan) return { status, tier: null, rank: -1 };
  let rank = -1;
  try {
    const plans = await rankedPlans();
    rank = plans.findIndex((p) => p.id === status.plan!.id);
    if (rank < 0) rank = plans.findIndex((p) => p.name === status.plan!.name);
  } catch {
    rank = 0;
  }
  if (rank < 0) rank = 0;
  return { status, tier: tierForRank(rank), rank };
}

/** Start of the current billing month, from Kwop's `until`. */
export function periodStart(until: string | null): Date {
  const now = new Date();
  if (!until) return new Date(now.getTime() - 30 * 86400_000);
  const d = new Date(until);
  if (isNaN(d.getTime())) return new Date(now.getTime() - 30 * 86400_000);
  while (d > now) d.setMonth(d.getMonth() - 1);
  return d;
}
