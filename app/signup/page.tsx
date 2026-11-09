import type { Metadata } from "next";
import { AuthShell } from "@/components/funnel/AuthShell";
import { AuthForm } from "@/components/funnel/AuthForm";
import { KwopFlow } from "@/components/landing/KwopFlow";

export const metadata: Metadata = { title: "Create your account", description: "Sign up to make and save your song sheets." };

export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/?resume=1";
  return (
    <>
      <KwopFlow />
      <AuthShell title="Sign up so MelodyFlow can write your song sheet" sub="Free to try. No card.">
        <AuthForm mode="signup" next={safe} />
      </AuthShell>
    </>
  );
}
