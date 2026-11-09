"use client";
import { SheetResult } from "@/components/music/SheetResult";
import type { SheetView } from "@/lib/types";

export function DevSheets({ locked, full }: { locked: SheetView; full: SheetView }) {
  return (
    <div className="mx-auto max-w-[880px] space-y-10 px-4 py-10">
      <SheetResult view={locked} onUnlock={() => {}} />
      <SheetResult view={full} />
    </div>
  );
}
