"use client";
import { FileDown, LayoutGrid, Mic, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useUnlock } from "@/components/funnel/UnlockProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/studio", label: "Studio", icon: Mic },
  { href: "/exports", label: "Exports", icon: FileDown },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/account", label: "Account", icon: UserRound },
];

export function AppNav() {
  const path = usePathname();
  const { me } = useUnlock();
  const active = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-white/[0.07] bg-[#090a08] px-4 py-6 md:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>
        <nav className="mt-10 space-y-1">
          {NAV.map(({ href, label, icon: I }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[15px] transition",
                active(href) ? "bg-white/[0.07] text-fg" : "text-muted hover:bg-white/[0.04] hover:text-fg",
              )}
            >
              <I className={cn("h-[18px] w-[18px]", active(href) && "text-lime")} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
          <p className="label">Plan</p>
          <p className="mt-1 text-[15px] font-semibold">{me?.paid ? me.plan?.name.replace(/^MelodyFlow\s+/i, "") : "Free"}</p>
          {me?.tier ? (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-lime" style={{ width: `${Math.min(100, (me.used / me.tier.sheetsPerMonth) * 100)}%` }} />
              </div>
              <p className="mt-2 text-[12.5px] text-muted tabular">
                {me.used} / {me.tier.sheetsPerMonth} song sheets this month
              </p>
            </>
          ) : (
            <Link href="/pricing" className="mt-2 inline-block text-[13px] text-lime hover:underline">
              See plans →
            </Link>
          )}
        </div>
      </aside>

      {/* phone: top bar + bottom tabs */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-ink/85 px-4 backdrop-blur-lg md:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <Link href="/studio?new=1" className="flex h-9 items-center gap-1.5 rounded-full bg-lime px-3.5 text-[13.5px] font-semibold text-ink active:scale-95">
          <Mic className="h-4 w-4" /> Record
        </Link>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/[0.08] bg-[#090a08]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        {NAV.map(({ href, label, icon: I }) => (
          <Link key={href} href={href} className={cn("flex h-[60px] flex-col items-center justify-center gap-1 text-[10.5px]", active(href) ? "text-fg" : "text-dim")}>
            <I className={cn("h-[21px] w-[21px]", active(href) && "text-lime")} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
