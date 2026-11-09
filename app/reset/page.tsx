"use client";
import { useState } from "react";
import { AuthShell } from "@/components/funnel/AuthShell";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <AuthShell title="Choose a new password">
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return setErr("Use at least 8 characters.");
          setBusy(true);
          const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
          setBusy(false);
          if (error) setErr("This link has expired. Ask for a new one from the log-in page.");
          else window.location.href = "/dashboard";
        }}
      >
        <input type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 w-full rounded-[14px] bg-white/[0.04] px-4 text-[15px] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-lime/70" />
        {err && <p className="text-[13px] text-coral">{err}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Save my new password
        </Button>
      </form>
    </AuthShell>
  );
}
