"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/funnel/AuthShell";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <AuthShell title="Reset your password" sub="We'll email you a link to choose a new one.">
      {sent ? (
        <p className="text-center text-[15px] leading-relaxed">
          Check your inbox: if <b>{email}</b> has an account, a reset link is on its way.
          <br />
          <Link href="/login" className="mt-4 inline-block text-lime underline-offset-4 hover:underline">
            Back to log in
          </Link>
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr("Enter your email address.");
            setBusy(true);
            setErr(null);
            const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
              redirectTo: `${location.origin}/auth/callback?next=/reset`,
            });
            setBusy(false);
            if (error && !error.message.toLowerCase().includes("not found")) setErr("We couldn't send the email. Try again in a minute.");
            else setSent(true);
          }}
        >
          <input type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-[14px] bg-white/[0.04] px-4 text-[15px] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-lime/70" />
          {err && <p className="text-[13px] text-coral">{err}</p>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Send the link
          </Button>
          <p className="pt-2 text-center text-[13px] text-muted">
            <Link href="/login" className="hover:text-fg">
              Back to log in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
