import "server-only";
import { rankedPlans } from "./plans-server";
import { shortName, TIERS } from "./plans";

export type PublicPlan = {
  id: number;
  name: string;
  short: string;
  rank: number;
  month: { cents: number; perDay: string };
  year: { cents: number; perDay: string } | null;
  featured: boolean;
  tag: string;
  unlocks: string[];
  adds: string[];
  sheetsPerMonth: number;
};

export async function publicPlans(): Promise<PublicPlan[]> {
  const plans = await rankedPlans();
  const mid = plans.length >= 3 ? 1 : plans.length - 1;
  return plans.map((p, i) => {
    const t = TIERS[Math.min(i, TIERS.length - 1)];
    return {
      id: p.id,
      name: p.name,
      short: shortName(p.name),
      rank: i,
      month: { cents: p.price_cents, perDay: p.per_day },
      year: p.yearly ? { cents: p.yearly.price_cents, perDay: p.yearly.per_day } : null,
      featured: i === mid,
      tag: t.tag,
      unlocks: t.unlocks,
      adds: t.adds,
      sheetsPerMonth: t.sheetsPerMonth,
    };
  });
}
