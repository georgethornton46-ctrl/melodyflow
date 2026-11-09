import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-5 text-center">
      <div className="dot-grid pointer-events-none absolute inset-0" />
      <div className="relative">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <p className="h-display mt-10 text-[96px] text-lime md:text-[140px]">404</p>
        <p className="mt-2 text-[18px]">This page hit a wrong note.</p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-lime px-6 font-semibold text-ink">
          Back to MelodyFlow
        </Link>
      </div>
    </main>
  );
}
