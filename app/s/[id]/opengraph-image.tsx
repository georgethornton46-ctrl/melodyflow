import { ogImage, OG_SIZE } from "@/lib/og";
import { keyName } from "@/lib/music";
import { publicSheet } from "@/lib/public-sheet";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A song sheet made with MelodyFlow";
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await publicSheet(id);
  if (!v) return ogImage({ title: "A song sheet", line: "Made with MelodyFlow", notes: [] });
  return ogImage({
    title: v.title,
    line: `${v.key ? keyName(v.key) : ""} · ${v.bpm} BPM · ${v.bars} bars · ${v.noteCount} notes`,
    notes: v.notes.map((n) => ({ m: n.m, s: n.s })),
    chords: v.chords ?? [],
  });
}
