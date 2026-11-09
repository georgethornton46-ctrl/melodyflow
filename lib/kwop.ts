import "server-only";

// Kwop = payments, plans and the owner's dashboard. Server only.
const API = () => {
  const u = process.env.KWOP_API;
  if (!u) throw new Error("KWOP_API is not set");
  return u.replace(/\/$/, "");
};

export type KwopPlan = {
  id: number;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  per_day: string;
  yearly: { price_cents: number; per_day: string } | null;
};
export type KwopApp = { name: string; checkout: "embedded" | "redirect" | null; plans: KwopPlan[] };
export type PlanStatus = { paid: boolean; plan: { id: number; name: string } | null; status: string | null; until: string | null };

let appCache: { at: number; v: KwopApp } | null = null;
export async function getApp(): Promise<KwopApp> {
  if (appCache && Date.now() - appCache.at < 5 * 60_000) return appCache.v;
  try {
    const r = await fetch(API(), { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`kwop ${r.status}`);
    const j = await r.json();
    const v: KwopApp = { name: j.name, checkout: j.checkout ?? null, plans: j.plans ?? [] };
    appCache = { at: Date.now(), v };
    return v;
  } catch (e) {
    console.error("[kwop] getApp failed", e);
    if (appCache) return appCache.v;
    throw e;
  }
}

const planCache = new Map<string, { at: number; v: PlanStatus }>();
/** The only source of truth for what a user paid for. Cached 60 s per email. */
export async function getPlan(email: string, opts: { fresh?: boolean } = {}): Promise<PlanStatus> {
  const k = email.toLowerCase();
  const hit = planCache.get(k);
  if (!opts.fresh && hit && Date.now() - hit.at < 60_000) return hit.v;
  try {
    const r = await fetch(`${API()}/plan?email=${encodeURIComponent(k)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`kwop plan ${r.status}`);
    const j = await r.json();
    const v: PlanStatus = { paid: !!j.paid, plan: j.plan ?? null, status: j.status ?? null, until: j.until ?? null };
    planCache.set(k, { at: Date.now(), v });
    return v;
  } catch (e) {
    console.error("[kwop] getPlan failed, keeping last known plan", e);
    if (hit) return hit.v;
    return { paid: false, plan: null, status: null, until: null };
  }
}
export function forgetPlan(email: string) {
  planCache.delete(email.toLowerCase());
}

export async function createCheckout(body: { plan: number; period: "month" | "year"; email: string; k?: string | null }) {
  const r = await fetch(`${API()}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, k: body.k || undefined }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j as { embed?: string | null; ref?: string; fallback_url?: string; error?: string } };
}

export async function confirm(ref: string) {
  const r = await fetch(`${API()}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  return (await r.json().catch(() => ({}))) as { ok?: boolean; paid?: boolean };
}

export async function cancel(email: string, except_ref?: string) {
  const r = await fetch(`${API()}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...(except_ref ? { except_ref } : {}) }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  return (await r.json().catch(() => ({}))) as { message?: string; manage_url?: string };
}

export type KwopEvent = "signup" | "onboarding_done" | "aha" | "paywall_view" | "feature_used";
/** Fire-and-forget. Never blocks, never throws. */
export function track(type: KwopEvent, email: string | null | undefined, detail?: string) {
  if (!email || !process.env.KWOP_API) return;
  fetch(`${API()}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, email, ...(detail ? { detail } : {}) }),
    signal: AbortSignal.timeout(5000),
  }).catch((e) => console.error("[kwop] event failed", type, e?.message));
}
