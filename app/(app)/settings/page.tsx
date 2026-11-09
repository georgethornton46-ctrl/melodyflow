"use client";
import { Check } from "lucide-react";
import { useState } from "react";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { PageTitle } from "@/components/app/States";
import { cn } from "@/lib/utils";

const GROUPS = [
  { key: "instrument", title: "I mostly play", options: [["guitar", "Guitar"], ["piano", "Piano / keys"], ["voice", "I just sing"]] },
  { key: "view", title: "Show my sheets as", options: [["both", "Notes + Tab"], ["notes", "Notes only"], ["tab", "Tab only"]] },
  { key: "names", title: "Letter names under notes", options: [["on", "On"], ["off", "Off"]] },
] as const;

export default function Settings() {
  const { me, refreshMe } = useUnlock();
  const [s, setS] = useState<Record<string, string>>({ instrument: "guitar", view: "both", names: "on", ...((me?.settings as Record<string, string>) || {}) });
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  async function save(key: string, value: string) {
    const next = { ...s, [key]: value };
    if (key === "instrument") next.view = value === "guitar" ? "both" : "notes";
    setS(next);
    setErr(false);
    const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    if (!r.ok) return setErr(true);
    setSaved(key);
    setTimeout(() => setSaved(null), 1400);
    refreshMe();
  }
  return (
    <div>
      <PageTitle label="SETTINGS" title="Make it yours" />
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <section key={g.key} className="rounded-[20px] bg-card p-5 ring-1 ring-white/[0.08]">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">{g.title}</h2>
              {saved === g.key && (
                <span className="flex items-center gap-1 text-[13px] text-lime">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {g.options.map(([v, label]) => (
                <button key={v} onClick={() => save(g.key, v)} className={cn("rounded-full px-4 py-2 text-[14px] ring-1 transition active:scale-95", s[g.key] === v ? "bg-lime text-ink ring-lime" : "text-fg/85 ring-white/12 hover:ring-white/25")}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        ))}
        {err && <p className="text-[14px] text-coral">We couldn&apos;t save that. Try again.</p>}
        <section className="rounded-[20px] bg-card p-5 ring-1 ring-white/[0.08]">
          <h2 className="text-[16px] font-semibold">Language</h2>
          <p className="mt-1 text-[14px] text-muted">English (US). More languages are not available yet.</p>
        </section>
      </div>
    </div>
  );
}
