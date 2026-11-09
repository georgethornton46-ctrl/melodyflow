import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // a lime tile with a waveform turning into a note
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#C8FF3D" />
      <path d="M6 17v-2M9.5 20v-8M13 18v-4" stroke="#060606" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 21.5V9.5l8-2v3.2l-8 2" stroke="#060606" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <ellipse cx="15.2" cy="21.8" rx="2.6" ry="2.1" fill="#060606" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-[-0.03em] text-[17px]", className)}>
      <LogoMark />
      MelodyFlow
    </span>
  );
}
