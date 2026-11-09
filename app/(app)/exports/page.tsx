"use client";
import { FileDown, FileMusic, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, PageTitle } from "@/components/app/States";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Exp = { id: string; sheet_id: string | null; sheet_title: string | null; format: "pdf" | "midi" | "musicxml"; semitones: number; created_at: string };

export default function Exports() {
  const [list, setList] = useState<Exp[] | null>(null);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    setErr(false);
    try {
      const r = await fetch("/api/exports", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setList((await r.json()).exports);
    } catch {
      setErr(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div>
      <PageTitle label="EXPORTS" title="Your downloads" />
      {err ? (
        <ErrorState text="We couldn't load your exports." onRetry={load} />
      ) : !list ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-[18px]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<FileDown className="h-5 w-5" />}
          text="No exports yet. Open a song sheet and download it as a PDF to print or share with your band."
          action={
            <Link href="/studio">
              <Button size="lg">Go to Studio</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((e) => (
            <li key={e.id} className="flex items-center gap-3.5 rounded-[18px] bg-card px-4 py-3.5 ring-1 ring-white/[0.08]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">{e.format === "pdf" ? <FileDown className="h-5 w-5" /> : <FileMusic className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{e.sheet_title || "Deleted song"}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {e.format === "musicxml" ? "MusicXML" : e.format.toUpperCase()}
                  {e.semitones ? ` · ${e.semitones > 0 ? "+" : ""}${e.semitones} semitones` : ""} · {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              {e.sheet_id && (
                <Link href={`/studio/${e.sheet_id}`} className="rounded-full px-3 py-1.5 text-[13px] text-muted ring-1 ring-white/10 hover:text-fg">
                  {e.format === "pdf" ? "Download again" : "Open"}
                </Link>
              )}
              <button
                aria-label="Delete from history"
                onClick={async () => {
                  const r = await fetch(`/api/exports/${e.id}`, { method: "DELETE" });
                  if (r.ok) setList((l) => l!.filter((x) => x.id !== e.id));
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-white/[0.06] hover:text-coral"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
