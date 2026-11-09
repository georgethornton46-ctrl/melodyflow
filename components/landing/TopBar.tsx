"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function TopBar({ links = true }: { links?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="fixed inset-x-0 top-[14px] z-50 px-3">
      <nav className={cn("glass mx-auto flex h-[58px] max-w-[980px] items-center justify-between rounded-[24px] pl-4 pr-2 transition-shadow", scrolled && "shadow-[0_12px_40px_-12px_rgba(0,0,0,.8)]")}>
        <Link href="/" aria-label="MelodyFlow home">
          <Logo />
        </Link>
        {links && (
          <div className="hidden items-center gap-1 text-[14px] text-muted md:flex">
            {[
              ["How it works", "/#how"],
              ["Features", "/#features"],
              ["Questions", "/#faq"],
            ].map(([t, h]) => (
              <a key={h} href={h} className="rounded-full px-3 py-2 transition hover:bg-white/[0.06] hover:text-fg">
                {t}
              </a>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Link href="/login" className="rounded-full px-3.5 py-2 text-[14px] text-fg/85 transition hover:bg-white/[0.06] hover:text-fg">
            Log in
          </Link>
          <a href="/#try" className="flex h-[42px] items-center gap-1.5 rounded-full bg-lime pl-4 pr-3 text-[14px] font-semibold text-ink transition hover:bg-[#d4ff63] active:scale-[0.955]">
            <span className="hidden sm:inline">Make my song sheet</span>
            <span className="sm:hidden">Try it</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </nav>
    </div>
  );
}
