"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SheetResult } from "@/components/music/SheetResult";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { ErrorState, PageTitle } from "@/components/app/States";
import { Skeleton } from "@/components/ui/skeleton";
import type { SheetView } from "@/lib/types";

function Compare() {
  const sp = useSearchParams();
  const { me, upgrade } = useUnlock();
  const [pair, setPair] = useState<SheetView[] | null>(null);
  const [err, setErr] = useState(false);
  const ids = [sp.get("a"), sp.get("b")].filter(Boolean) as string[];
  const load = async () => {
    setErr(false);
    try {
      const r = await Promise.all(ids.map((i) => fetch(`/api/sheets/${i}`).then((x) => (x.ok ? x.json() : Promise.reject()))));
      setPair(r.map((x) => x.sheet));
    } catch {
      setErr(true);
    }
  };
  useEffect(() => {
    if (me?.tier?.compare) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.tier?.compare]);

  if (!me?.tier?.compare)
    return (
      <div className="py-16 text-center">
        <p className="text-[18px] font-semibold">Comparing takes is part of Studio.</p>
        <button onClick={() => upgrade({ reason: "Compare two takes side by side" })} className="mt-4 text-lime hover:underline">
          See what Studio adds
        </button>
      </div>
    );
  return (
    <div>
      <Link href="/studio" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Studio
      </Link>
      <PageTitle label="COMPARE TAKES" title="Side by side" />
      {err ? (
        <ErrorState onRetry={load} />
      ) : !pair ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[480px] rounded-[24px]" />
          <Skeleton className="h-[480px] rounded-[24px]" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pair.map((s) => (
            <SheetResult key={s.id} view={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Compare />
    </Suspense>
  );
}
