import type { Metadata } from "next";
import { AuthShell } from "@/components/funnel/AuthShell";
import { AuthForm } from "@/components/funnel/AuthForm";
import { KwopFlow } from "@/components/landing/KwopFlow";

export const metadata: Metadata = { title: "Log in", description: "Log in to your MelodyFlow account." };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return (
    <>
      <KwopFlow />
      <AuthShell title="Welcome back" sub="Your song sheets are waiting.">
        {error && <p className="mb-4 rounded-xl bg-coral/10 px-4 py-3 text-center text-[14px] text-coral">Google sign-in didn&apos;t finish. Try again.</p>}
        <AuthForm mode="login" next={safe} />
      </AuthShell>
    </>
  );
}
