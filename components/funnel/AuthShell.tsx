import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-4 py-14">
      <div className="dot-grid pointer-events-none absolute inset-0" />
      <div className="top-glow pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-[420px]">
        <Link href="/" className="mb-8 flex justify-center" aria-label="MelodyFlow home">
          <Logo className="text-[19px]" />
        </Link>
        <div className="card rounded-[24px] px-6 py-8 md:px-8">
          <h1 className="text-center text-[26px] font-semibold tracking-[-0.035em]">{title}</h1>
          {sub && <p className="mb-7 mt-1.5 text-center text-[14.5px] text-muted">{sub}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}
