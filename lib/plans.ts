// Quotas by plan rank (cheapest = 0). Names / ids / prices always come from Kwop.

export type Tier = {
  rank: number;
  sheetsPerMonth: number;
  maxSeconds: number;
  keyChanger: boolean;
  midi: boolean;
  compare: boolean;
  historyDays: number | null; // null = unlimited
  tag: string;
  unlocks: string[];
  adds: string[]; // what this plan adds over the one below (upgrade sheet)
};

export const TIERS: Tier[] = [
  {
    rank: 0,
    sheetsPerMonth: 20,
    maxSeconds: 30,
    keyChanger: false,
    midi: false,
    compare: false,
    historyDays: 30,
    tag: "For catching ideas",
    unlocks: [
      "20 song sheets a month",
      "Takes up to 30 seconds",
      "Full notes, guitar tab and chords",
      "Key and chord progression for every song",
      "PDF export, ready to print",
      "Your sheets saved for 30 days",
    ],
    adds: ["The full sheet: every bar, every chord", "PDF export", "20 song sheets a month"],
  },
  {
    rank: 1,
    sheetsPerMonth: 60,
    maxSeconds: 120,
    keyChanger: true,
    midi: false,
    compare: false,
    historyDays: null,
    tag: "For writing real songs",
    unlocks: [
      "60 song sheets a month",
      "Takes up to 2 minutes: whole verses and choruses",
      "Key Changer: move any song to any of the 12 keys",
      "Capo hints so it fits easy chord shapes",
      "PDF export in any key",
      "Every sheet saved, forever",
    ],
    adds: ["Key Changer: any of the 12 keys + capo hints", "Takes up to 2 minutes", "60 song sheets a month, saved forever"],
  },
  {
    rank: 2,
    sheetsPerMonth: 150,
    maxSeconds: 300,
    keyChanger: true,
    midi: true,
    compare: true,
    historyDays: null,
    tag: "For bands & producers",
    unlocks: [
      "150 song sheets a month",
      "Takes up to 5 minutes: full songs",
      "MIDI export: drop the melody into GarageBand, Logic or Ableton",
      "MusicXML export for MuseScore, Sibelius and Finale",
      "Compare two takes side by side",
      "Everything in the plan below",
    ],
    adds: ["MIDI + MusicXML export for your DAW", "Takes up to 5 minutes", "150 song sheets a month + compare takes"],
  },
];

export const FREE = { triesPerDay: 3, maxSeconds: 30, clearBars: 2 };

export function tierForRank(rank: number | null | undefined): Tier | null {
  if (rank === null || rank === undefined || rank < 0) return null;
  return TIERS[Math.min(rank, TIERS.length - 1)];
}

/** Short display name: "MelodyFlow Pro" → "Pro". */
export function shortName(name: string) {
  return name.replace(/^MelodyFlow\s+/i, "").trim() || name;
}
