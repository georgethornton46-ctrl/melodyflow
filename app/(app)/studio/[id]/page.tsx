import type { Metadata } from "next";
import { SheetPage } from "./view";
export const metadata: Metadata = { title: "Song sheet" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SheetPage id={id} />;
}
