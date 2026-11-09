"use client";
import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { PageTitle } from "@/components/app/States";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Account() {
  const { me, refreshMe, upgrade, unlock } = useUnlock();
  const [name, setName] = useState(me?.name || "");
  const [savedName, setSavedName] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelRes, setCancelRes] = useState<{ message: string; manage_url: string | null } | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const planName = me?.plan?.name.replace(/^MelodyFlow\s+/i, "");

  async function logout() {
    await supabaseBrowser().auth.signOut();
    window.location.href = "/";
  }

  return (
    <div>
      <PageTitle label="ACCOUNT" title="Your account" />
      <div className="space-y-4">
        <section className="rounded-[20px] bg-card p-5 ring-1 ring-white/[0.08]">
          <h2 className="text-[16px] font-semibold">Profile</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
              if (r.ok) {
                setSavedName(true);
                setTimeout(() => setSavedName(false), 1500);
                refreshMe();
              }
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" maxLength={60} className="h-12 rounded-[14px] bg-white/[0.04] px-4 text-[15px] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-lime/70" />
            <Button type="submit" variant="subtle" size="lg">
              {savedName ? "Saved" : "Save"}
            </Button>
          </form>
          <p className="mt-3 text-[14px] text-muted">
            {me?.email} · signed in with {me?.provider === "google" ? "Google" : "email"}
          </p>
        </section>

        <section id="billing" className="rounded-[20px] bg-card p-5 ring-1 ring-white/[0.08]">
          <h2 className="text-[16px] font-semibold">Plan &amp; billing</h2>
          {me?.paid ? (
            <>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[24px] font-semibold tracking-[-0.02em]">{planName}</p>
                  <p className="text-[14px] text-muted">
                    {me.planStatus === "canceled" ? "Ends" : "Renews"} {me.until ? new Date(me.until).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "monthly"} · {me.used} / {me.tier?.sheetsPerMonth} song sheets used
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="subtle" onClick={() => upgrade({ reason: "Get more from MelodyFlow" })}>
                    Change plan
                  </Button>
                  <Link href="/pricing">
                    <Button variant="ghost">All plans</Button>
                  </Link>
                </div>
              </div>
              <button onClick={() => (setCancelRes(null), setCancelOpen(true))} className="mt-5 text-[14px] text-muted underline-offset-4 hover:text-coral hover:underline">
                Cancel my subscription
              </button>
            </>
          ) : (
            <div className="mt-3">
              <p className="text-[15px]">You&apos;re on the free version: 3 song sheets a day, first 2 bars in clear.</p>
              <Button className="mt-4" onClick={() => unlock()}>
                See plans
              </Button>
            </div>
          )}
          <p className="mt-4 text-[12.5px] text-dim">Payments are processed by Whop through Kwop. MelodyFlow never sees your card.</p>
        </section>

        <section className="rounded-[20px] bg-card p-5 ring-1 ring-white/[0.08]">
          <h2 className="text-[16px] font-semibold">Session</h2>
          <Button variant="outline" className="mt-4" onClick={logout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </section>

        <section className="rounded-[20px] bg-card p-5 ring-1 ring-coral/20">
          <h2 className="text-[16px] font-semibold">Delete my account</h2>
          <p className="mt-1 text-[14px] text-muted">Deletes your account, every song sheet and your export history. Any subscription is canceled.</p>
          <Button variant="danger" className="mt-4" onClick={() => setDelOpen(true)}>
            Delete my account
          </Button>
        </section>
      </div>

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} label="Cancel subscription" width={440}>
        <div className="px-6 pb-8 pt-6">
          {cancelRes ? (
            <>
              <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Done</h2>
              <p className="mt-2 text-[15px] leading-relaxed">{cancelRes.message}</p>
              {cancelRes.manage_url && (
                <a href={cancelRes.manage_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-lime hover:underline">
                  Manage my subscription <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Button variant="subtle" size="lg" className="mt-6 w-full" onClick={() => setCancelOpen(false)}>
                Close
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Cancel {planName}?</h2>
              <p className="mt-2 text-[14.5px] text-muted">You keep your plan until the end of the period you paid for. Your song sheets stay saved.</p>
              {err && <p className="mt-3 text-[14px] text-coral">{err}</p>}
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <Button variant="subtle" size="lg" onClick={() => setCancelOpen(false)}>
                  Keep my plan
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  loading={busy === "cancel"}
                  onClick={async () => {
                    setBusy("cancel");
                    setErr(null);
                    const r = await fetch("/api/billing/cancel", { method: "POST" });
                    const j = await r.json().catch(() => ({}));
                    setBusy(null);
                    if (!r.ok) return setErr(j.error || "We couldn't reach billing. Try again.");
                    setCancelRes(j);
                    refreshMe();
                  }}
                >
                  Cancel it
                </Button>
              </div>
            </>
          )}
        </div>
      </Sheet>

      <Sheet open={delOpen} onClose={() => setDelOpen(false)} label="Delete account" width={440}>
        <div className="px-6 pb-8 pt-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Delete everything?</h2>
          <p className="mt-2 text-[14.5px] text-muted">Your account and all your song sheets are deleted for good. This can&apos;t be undone.</p>
          {err && <p className="mt-3 text-[14px] text-coral">{err}</p>}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <Button variant="subtle" size="lg" onClick={() => setDelOpen(false)}>
              Keep my account
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={busy === "del"}
              onClick={async () => {
                setBusy("del");
                const r = await fetch("/api/account", { method: "DELETE" });
                if (!r.ok) {
                  setBusy(null);
                  return setErr("We couldn't delete your account. Try again.");
                }
                await supabaseBrowser().auth.signOut().catch(() => {});
                try {
                  localStorage.removeItem("mf_last_sheet");
                } catch {}
                window.location.href = "/";
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
