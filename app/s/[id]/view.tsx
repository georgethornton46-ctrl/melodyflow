"use client";
import { SheetResult } from "@/components/music/SheetResult";
import { Cta } from "@/components/ui/button";
import type { SheetView } from "@/lib/types";

export function SharedSheet({ view }: { view: SheetView }) {
  return (
    <>
      <p className="label mb-4 text-center">[ SHARED WITH YOU ]</p>
      <SheetResult view={view} />
      <div className="card mt-8 flex flex-col items-center rounded-[24px] px-6 py-10 text-center">
        <h2 className="h-display text-[32px] md:text-[44px]">Got a melody of your own?</h2>
        <p className="mt-2 text-[15.5px] text-muted">Hum it. MelodyFlow writes the notes, the tab and the chords in seconds.</p>
        <div className="mt-6">
          <Cta href="/">Make my song sheet</Cta>
        </div>
      </div>
    </>
  );
}
