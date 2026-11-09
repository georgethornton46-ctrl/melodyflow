"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-[70dvh] place-items-center px-5 text-center">
      <div>
        <p className="text-[22px] font-semibold tracking-[-0.02em]">Something went off-key.</p>
        <p className="mt-2 text-[15px] text-muted">Your song sheets are safe. Try again in a moment.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="h-11 rounded-full bg-lime px-5 font-semibold text-ink">
            Try again
          </button>
          <Link href="/" className="grid h-11 place-items-center rounded-full px-5 ring-1 ring-white/15">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
