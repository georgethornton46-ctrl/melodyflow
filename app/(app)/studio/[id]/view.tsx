"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, FileDown, FileMusic, KeyRound, Lock, Minus, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUnlock, trackEvent } from "@/components/funnel/UnlockProvider";
import { SheetResult } from "@/components/music/SheetResult";
import { ErrorState } from "@/components/app/States";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { capoHint, keyName, transposeSheet, type Sheet as MSheet } from "@/lib/music";
import type { SheetView } from "@/lib/types";
import { downloadPdf } from "@/lib/pdf";
import { personalLine } from "@/components/funnel/TryFlow";
import { cn } from "@/lib/utils";

type Mode = "both" | "notes" | "tab";

export function SheetPage({ id }: { id: string }) {
  const router = useRouter();
  const { me, unlock, upgrade, plans, ensurePlans } = useUnlock();
  const [view, setView] = useState<SheetView | null>(null);
  const [err, setErr] = useState<"notfound" | "error" | null>(null);
  const [semis, setSemis] = useState(0);
  const settings = (me?.settings || {}) as { view?: Mode; names?: string };
  const [mode, setMode] = useState<Mode>(settings.view || "both");
  const [names, setNames] = useState(settings.names !== "off");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rename, setRename] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [share, setShare] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(`/api/sheets/${id}`, { cache: "no-store" });
      if (r.status === 404) return setErr("notfound");
      if (!r.ok) throw new Error();
      setView((await r.json()).sheet);
    } catch {
      setErr("error");
    }
  }, [id]);
  useEffect(() => {
    load();
    ensurePlans();
  }, [load, ensurePlans]);

  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };

  const transposed = useMemo(() => {
    if (!view || view.locked || !view.key || !view.chords) return null;
    const base: MSheet = { bpm: view.bpm, bars: view.bars, notes: view.notes, key: view.key, chords: view.chords, range: view.range, confidence: view.confidence };
    return transposeSheet(base, semis);
  }, [view, semis]);

  const nextName = (rank: number) => plans?.[rank]?.short || "the next plan";
  const keyChanger = !!me?.tier?.keyChanger;
  const midi = !!me?.tier?.midi;

  async function pdf() {
    if (!view || !transposed) return;
    setBusy("pdf");
    try {
      const r = await fetch("/api/exports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheetId: view.id, semitones: semis }) });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (r.status === 402) return unlock();
        throw new Error(j.error);
      }
      await downloadPdf({ title: view.title + (semis ? ` (${keyName(transposed.key)})` : ""), notes: transposed.notes, chords: transposed.chords, key: transposed.key, bpm: view.bpm, bars: view.bars, mode, showNames: names });
      say("PDF downloaded");
    } catch {
      say("The PDF couldn't be made. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function fileExport(format: "midi" | "musicxml") {
    if (!midi) return upgrade({ reason: format === "midi" ? "Export MIDI to your DAW" : "Export MusicXML to MuseScore or Sibelius" });
    window.location.href = `/api/sheets/${id}/export?format=${format}&semitones=${semis}`;
    say(format === "midi" ? "MIDI file downloading" : "MusicXML file downloading");
  }

  async function patch(body: Record<string, unknown>) {
    const r = await fetch(`/api/sheets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error();
    setView((await r.json()).sheet);
  }

  if (err === "notfound")
    return (
      <div className="py-20 text-center">
        <p className="text-[20px] font-semibold">This song sheet doesn&apos;t exist anymore.</p>
        <Link href="/studio" className="mt-4 inline-block text-lime hover:underline">
          Back to Studio
        </Link>
      </div>
    );
  if (err) return <ErrorState text="We couldn't load this song sheet." onRetry={load} />;
  if (!view)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[520px] rounded-[24px]" />
      </div>
    );

  const shareUrl = typeof window !== "undefined" ? `${location.origin}/s/${view.id}` : "";
  const hint = transposed ? capoHint(transposed) : null;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link href="/studio" className="inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> Studio
        </Link>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setRename(view.title)} aria-label="Rename">
            <Pencil className="h-4 w-4" /> <span className="hidden sm:inline">Rename</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDel(true)} aria-label="Delete">
            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* toolbar */}
      {!view.locked && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <div className="flex shrink-0 rounded-full bg-white/[0.05] p-1 text-[13.5px] ring-1 ring-white/10">
            {(["both", "notes", "tab"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn("rounded-full px-3.5 py-1.5 transition", mode === m ? "bg-fg text-ink" : "text-muted hover:text-fg")}>
                {m === "both" ? "Notes + Tab" : m === "notes" ? "Notes" : "Tab"}
              </button>
            ))}
          </div>
          <button onClick={() => setNames((n) => !n)} className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] ring-1 transition", names ? "bg-lime/10 text-lime ring-lime/40" : "text-muted ring-white/10")}>
            Note names
          </button>
          {/* key changer */}
          <div className={cn("flex shrink-0 items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10", !keyChanger && "opacity-90")}>
            <KeyRound className="ml-2 h-4 w-4 text-lime" />
            <button
              aria-label="Key down"
              onClick={() => (keyChanger ? (setSemis((s) => Math.max(-11, s - 1)), trackEvent("feature_used", "Key Changer")) : upgrade({ reason: "Change the key of any song" }))}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[88px] text-center text-[13.5px] font-medium tabular">{transposed ? keyName(transposed.key) : "—"}</span>
            <button
              aria-label="Key up"
              onClick={() => (keyChanger ? (setSemis((s) => Math.min(11, s + 1)), trackEvent("feature_used", "Key Changer")) : upgrade({ reason: "Change the key of any song" }))}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
            </button>
            {!keyChanger && (
              <span className="mr-2 flex items-center gap-1 text-[12px] text-muted">
                <Lock className="h-3 w-3" /> {nextName(1)}
              </span>
            )}
          </div>
          {semis !== 0 && (
            <button onClick={() => setSemis(0)} className="shrink-0 rounded-full px-3 py-1.5 text-[13px] text-muted ring-1 ring-white/10 hover:text-fg">
              Original key
            </button>
          )}
        </div>
      )}
      {hint && keyChanger && <p className="-mt-1 mb-4 text-[13px] text-muted">Guitar tip: {hint}.</p>}

      <SheetResult
        view={view}
        override={transposed}
        mode={mode}
        showNames={names}
        onUnlock={() => unlock({ title: "Your song sheet is ready.", line: personalLine(view), onUnlocked: load })}
      />

      {/* actions */}
      {!view.locked && (
        <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Button size="lg" onClick={pdf} loading={busy === "pdf"} className="col-span-2 md:col-span-1">
            <FileDown className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShare(true)}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="lg" onClick={() => fileExport("midi")}>
            <FileMusic className="h-4 w-4" /> MIDI {!midi && <Lock className="h-3.5 w-3.5 text-muted" />}
          </Button>
          <Button variant="outline" size="lg" onClick={() => fileExport("musicxml")} className="col-span-2 md:col-span-1">
            <FileMusic className="h-4 w-4" /> MusicXML {!midi && <Lock className="h-3.5 w-3.5 text-muted" />}
          </Button>
        </div>
      )}
      {!view.locked && !midi && (
        <p className="mt-3 text-center text-[12.5px] text-dim">
          MIDI and MusicXML export: unlock with {nextName(2)}.
        </p>
      )}

      {/* rename */}
      <Sheet open={rename !== null} onClose={() => setRename(null)} label="Rename" width={420}>
        <form
          className="px-6 pb-8 pt-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await patch({ title: rename });
              setRename(null);
              say("Renamed");
            } catch {
              say("Couldn't rename. Try again.");
            }
          }}
        >
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Rename this song</h2>
          <input autoFocus maxLength={80} value={rename ?? ""} onChange={(e) => setRename(e.target.value)} className="mt-4 h-12 w-full rounded-[14px] bg-white/[0.05] px-4 text-[15px] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-lime/70" />
          <Button type="submit" size="lg" className="mt-4 w-full">
            Save
          </Button>
        </form>
      </Sheet>

      {/* delete */}
      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} label="Delete" width={420}>
        <div className="px-6 pb-8 pt-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Delete &ldquo;{view.title}&rdquo;?</h2>
          <p className="mt-2 text-[14.5px] text-muted">The song sheet is removed for good. This can&apos;t be undone.</p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <Button variant="subtle" size="lg" onClick={() => setConfirmDel(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={busy === "del"}
              onClick={async () => {
                setBusy("del");
                const r = await fetch(`/api/sheets/${id}`, { method: "DELETE" });
                setBusy(null);
                if (r.ok) router.push("/studio");
                else say("Couldn't delete. Try again.");
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Sheet>

      {/* share */}
      <Sheet open={share} onClose={() => setShare(false)} label="Share" width={440}>
        <div className="px-6 pb-8 pt-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Share this song sheet</h2>
          <p className="mt-2 text-[14.5px] text-muted">Anyone with the link sees the sheet. They can&apos;t edit it or see your other songs.</p>
          <label className="mt-5 flex items-center justify-between rounded-[16px] bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/10">
            <span className="text-[15px]">Public link</span>
            <button
              role="switch"
              aria-checked={view.isPublic}
              onClick={async () => {
                try {
                  await patch({ public: !view.isPublic });
                  if (!view.isPublic) trackEvent("feature_used", "Share");
                } catch {
                  say("Couldn't change sharing. Try again.");
                }
              }}
              className={cn("relative h-7 w-12 rounded-full transition", view.isPublic ? "bg-lime" : "bg-white/15")}
            >
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-ink transition-all", view.isPublic ? "left-6" : "left-1 bg-fg")} />
            </button>
          </label>
          {view.isPublic && (
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 rounded-[14px] bg-black/40 px-3 py-2.5 ring-1 ring-white/10">
                <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-muted">{shareUrl}</span>
                <button
                  onClick={async () => {
                    await navigator.clipboard?.writeText(shareUrl).catch(() => {});
                    say("Link copied");
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button size="lg" className="w-full" onClick={() => navigator.share({ title: view.title, text: "Here's my new song sheet", url: shareUrl }).catch(() => {})}>
                  <Share2 className="h-4 w-4" /> Send it
                </Button>
              )}
            </div>
          )}
        </div>
      </Sheet>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed bottom-24 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-fg px-4 py-2.5 text-[14px] font-medium text-ink shadow-xl md:bottom-8">
            <Check className="h-4 w-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
