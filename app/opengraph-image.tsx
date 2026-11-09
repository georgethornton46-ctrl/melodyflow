import { ogImage, OG_SIZE } from "@/lib/og";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "MelodyFlow: hum it, get the sheet music";
export default function Image() {
  const tune = [64, 67, 69, 67, 72, 71, 69, 67, 65, 69, 67, 64, 62, 64, 65, 67];
  return ogImage({
    title: "Hum it. Get the sheet music.",
    line: "Notes, guitar tab and chords from a voice memo, in seconds.",
    notes: tune.map((m, i) => ({ m, s: i * 4 })),
    chords: ["C", "G", "F", "C", "G", "C"],
  });
}
