import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-ink">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 pb-6 pt-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-[260px] text-[14px] text-muted">From voice note to sheet music. Made for songwriters who hum first and write later.</p>
        </div>
        <div>
          <p className="label">Product</p>
          <ul className="mt-3 space-y-2 text-[14px] text-fg/80">
            <li><a href="/#try" className="hover:text-fg">Make a song sheet</a></li>
            <li><a href="/#how" className="hover:text-fg">How it works</a></li>
            <li><a href="/#features" className="hover:text-fg">Features</a></li>
          </ul>
        </div>
        <div>
          <p className="label">Account</p>
          <ul className="mt-3 space-y-2 text-[14px] text-fg/80">
            <li><Link href="/login" className="hover:text-fg">Log in</Link></li>
            <li><Link href="/signup" className="hover:text-fg">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Legal</p>
          <ul className="mt-3 space-y-2 text-[14px] text-fg/80">
            <li><Link href="/terms" className="hover:text-fg">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-fg">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto max-w-[1120px] px-5 pb-2 text-[12.5px] text-dim md:px-8">© {new Date().getFullYear()} MelodyFlow. All rights reserved.</p>
      <div
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap text-center font-semibold leading-[0.8] tracking-[-0.06em] text-fg"
        style={{
          fontSize: "clamp(64px, 19vw, 260px)",
          opacity: 0.13,
          maskImage: "linear-gradient(180deg, #000 20%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 20%, transparent 95%)",
        }}
      >
        MelodyFlow
      </div>
    </footer>
  );
}
