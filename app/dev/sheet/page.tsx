import { notFound } from "next/navigation";
import { analyse } from "@/lib/music";
import { toView, type SheetRow } from "@/lib/sheet-view";
import { DevSheets } from "./client";

// Dev-only preview of the sheet renderer (404 in production).
export default function DevSheet() {
  if (process.env.NODE_ENV === "production") notFound();
  const tune: [number, number][] = [[64,1],[67,1],[69,1],[67,1],[72,1.5],[71,0.5],[69,1],[67,1],[65,1],[69,1],[67,1],[64,1],[62,1],[64,0.5],[65,0.5],[67,2],[69,1],[66,1],[65,1],[64,1],[62,1],[64,1],[60,2]];
  const midi: number[] = [], rms: number[] = [];
  for (let i = 0; i < 20; i++) {
    midi.push(0);
    rms.push(0);
  }
  for (const [m, b] of tune) {
    const n = Math.round((b * 0.6) / 0.01);
    for (let i = 0; i < n; i++) {
      const edge = i < 3 || i > n - 6;
      midi.push(edge ? 0 : m - 12 + 0.2 + 0.05 * Math.sin(i * 0.3));
      rms.push(edge ? 0.01 : 0.5);
    }
  }
  const data = analyse(midi, rms, 0.01)!;
  const row: SheetRow = { id: "00000000-0000-0000-0000-000000000000", user_id: null, title: "Late-night idea", data, waveform: Array.from({ length: 96 }, (_, i) => Math.round((0.3 + 0.7 * Math.abs(Math.sin(i * 0.4))) * 100) / 100), duration: 14.2, source: "example", public: false, created_at: new Date().toISOString() };
  return <DevSheets locked={toView(row, false)} full={toView(row, true)} />;
}
