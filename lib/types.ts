// Client-side mirrors of server types (no server imports).
export type { SheetView } from "./sheet-view";
export type PublicPlanC = {
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
export type MeC = {
  email: string;
  name: string | null;
  provider: string;
  settings: Record<string, unknown>;
  paid: boolean;
  plan: { id: number; name: string } | null;
  planStatus: string | null;
  until: string | null;
  rank: number;
  tier: {
    rank: number;
    sheetsPerMonth: number;
    maxSeconds: number;
    keyChanger: boolean;
    midi: boolean;
    compare: boolean;
    historyDays: number | null;
  } | null;
  used: number;
};
export const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
export const money2 = (cents: number) => `$${(cents / 100).toFixed(2)}`;
