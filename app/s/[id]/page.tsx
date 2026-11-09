import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicSheet } from "@/lib/public-sheet";
import { keyName } from "@/lib/music";
import { TopBar } from "@/components/landing/TopBar";
import { SharedSheet } from "./view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const v = await publicSheet(id);
  if (!v) return { title: "Song sheet" };
  return {
    title: v.title,
    description: `A song sheet in ${v.key ? keyName(v.key) : "its key"}, ${v.bpm} BPM. Made with MelodyFlow from a hummed melody.`,
  };
}

export default async function Shared({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await publicSheet(id);
  if (!v) notFound();
  return (
    <>
      <TopBar links={false} />
      <main className="mx-auto max-w-[880px] px-4 pb-20 pt-[100px] md:pt-[120px]">
        <SharedSheet view={v} />
      </main>
    </>
  );
}
