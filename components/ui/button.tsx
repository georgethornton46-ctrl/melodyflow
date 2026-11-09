"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-[transform,background-color,color,box-shadow,opacity] duration-200 active:scale-[0.955] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        lime: "bg-lime text-ink hover:bg-[#d4ff63]",
        white: "bg-fg text-ink hover:bg-white",
        ghost: "text-fg hover:bg-white/[0.06]",
        outline: "border border-line-2 text-fg hover:bg-white/[0.05]",
        subtle: "bg-white/[0.06] text-fg hover:bg-white/[0.1]",
        danger: "bg-coral/15 text-coral hover:bg-coral/25",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-14 px-7 text-base",
      },
    },
    defaultVariants: { variant: "lime", size: "md" },
  },
);

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant, size, loading, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

export function buttonClass(v?: VariantProps<typeof button>, className?: string) {
  return cn(button(v), className);
}

/** The main action: a breathing lime pill with a nudging arrow. */
export function Cta({
  children,
  href,
  onClick,
  className,
  size = "lg",
  type,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  size?: "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}) {
  const cls = cn(
    "cta inline-flex items-center justify-between gap-4 rounded-full bg-lime text-ink font-semibold tracking-[-0.01em] hover:bg-[#d4ff63] disabled:opacity-60",
    size === "lg" ? "h-[64px] pl-7 pr-2 text-[17px]" : "h-[52px] pl-5 pr-1.5 text-[15px]",
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      <span
        className={cn(
          "grid place-items-center rounded-full bg-ink text-lime",
          size === "lg" ? "h-12 w-12" : "h-10 w-10",
        )}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="cta-arrow h-5 w-5" />}
      </span>
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  return (
    <button type={type ?? "button"} className={cls} onClick={onClick} disabled={disabled || loading}>
      {inner}
    </button>
  );
}
