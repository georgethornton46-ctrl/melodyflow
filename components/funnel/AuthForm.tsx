"use client";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { deviceId } from "@/lib/device";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./GoogleIcon";
import { cn } from "@/lib/utils";

const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1";

export async function claimTries() {
  await fetch("/api/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: deviceId() }),
  }).catch(() => {});
}

function friendly(msg: string, mode: "signup" | "login") {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
    return { field: "email", text: "This email already has an account. Log in?" };
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return { field: "password", text: "Wrong email or password. Try again, or reset your password." };
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak")))
    return { field: "password", text: "Use at least 8 characters." };
  if (m.includes("email") && m.includes("invalid")) return { field: "email", text: "This email doesn't look right." };
  if (m.includes("rate")) return { field: "form", text: "Too many tries. Wait a minute and try again." };
  return { field: "form", text: mode === "signup" ? "We couldn't create your account. Try again." : "We couldn't log you in. Try again." };
}

export function AuthForm({
  mode: initialMode,
  onDone,
  next,
  compact = false,
}: {
  mode: "signup" | "login";
  onDone?: (isNew: boolean) => void; // in a sheet: stay on the page
  next?: string; // for full pages and Google
  compact?: boolean;
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gBusy, setGBusy] = useState(false);
  const [err, setErr] = useState<{ field: string; text: string } | null>(null);

  const go = (isNew: boolean) => {
    if (onDone) onDone(isNew);
    else window.location.href = next || "/dashboard";
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr({ field: "email", text: "Enter your email address." });
    if (mode === "signup" && password.length < 8) return setErr({ field: "password", text: "Use at least 8 characters." });
    if (!password) return setErr({ field: "password", text: "Enter your password." });
    setBusy(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0)
          throw new Error("User already registered");
        if (!data.session) {
          const r = await sb.auth.signInWithPassword({ email: email.trim(), password });
          if (r.error) throw r.error;
        }
        await claimTries();
        go(true);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        await claimTries();
        go(false);
      }
    } catch (e) {
      setErr(friendly((e as Error).message || "", mode));
      setBusy(false);
    }
  }

  async function google() {
    setGBusy(true);
    const sb = supabaseBrowser();
    const base = next || window.location.pathname + window.location.search;
    const target = base + (base.includes("?") ? "&" : "?") + "resume=1";
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
      },
    });
  }

  const input =
    "h-12 w-full rounded-[14px] bg-white/[0.04] px-4 text-[15px] text-fg ring-1 ring-white/10 placeholder:text-dim outline-none transition focus:ring-2 focus:ring-lime/70";

  return (
    <div className={cn("w-full", compact ? "" : "")}>
      {GOOGLE && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={gBusy}
            className="flex h-[54px] w-full items-center justify-center gap-3 rounded-full bg-white text-[16px] font-semibold text-[#1f1f1f] transition hover:bg-[#f2f2f2] active:scale-[0.97] disabled:opacity-70"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-dim">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="mf-email" className="sr-only">
            Email
          </label>
          <input id="mf-email" type="email" autoComplete="email" inputMode="email" placeholder="you@email.com" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
          {err?.field === "email" && (
            <p className="mt-1.5 text-[13px] text-coral">
              {err.text}{" "}
              {err.text.includes("Log in") && (
                <button type="button" className="underline" onClick={() => (setMode("login"), setErr(null))}>
                  Log in
                </button>
              )}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="mf-pass" className="sr-only">
            Password
          </label>
          <div className="relative">
            <input
              id="mf-pass"
              type={show ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Create a password (8+ characters)" : "Password"}
              className={cn(input, "pr-12")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-fg" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {err?.field === "password" && <p className="mt-1.5 text-[13px] text-coral">{err.text}</p>}
        </div>
        {err?.field === "form" && <p className="text-[13px] text-coral">{err.text}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {mode === "signup" ? "Create my account" : "Log in"}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
        {mode === "signup" ? (
          <span>
            Already have an account?{" "}
            <button type="button" className="font-medium text-fg underline-offset-4 hover:underline" onClick={() => (setMode("login"), setErr(null))}>
              Log in
            </button>
          </span>
        ) : (
          <span>
            New here?{" "}
            <button type="button" className="font-medium text-fg underline-offset-4 hover:underline" onClick={() => (setMode("signup"), setErr(null))}>
              Create an account
            </button>
          </span>
        )}
        {mode === "login" && (
          <Link href="/forgot" className="hover:text-fg">
            Forgot password?
          </Link>
        )}
      </div>
      <p className="mt-5 text-center text-[12px] leading-relaxed text-dim">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-fg">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
