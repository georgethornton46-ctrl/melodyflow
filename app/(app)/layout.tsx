import { redirect } from "next/navigation";
import { me } from "@/lib/me";
import { UnlockProvider } from "@/components/funnel/UnlockProvider";
import { AppNav } from "@/components/app/AppNav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const m = await me();
  if (!m) redirect("/login");
  return (
    <UnlockProvider initialMe={m}>
      <div className="min-h-[100dvh] md:pl-[248px]">
        <AppNav />
        <main className="mx-auto max-w-[1040px] px-4 pb-32 pt-6 md:px-10 md:pb-16 md:pt-10">{children}</main>
      </div>
    </UnlockProvider>
  );
}
