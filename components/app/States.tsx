import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ text = "We couldn't load this.", onRetry }: { text?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] bg-white/[0.03] px-6 py-12 text-center ring-1 ring-white/[0.07]">
      <AlertCircle className="h-6 w-6 text-coral" />
      <p className="mt-3 text-[15px]">{text}</p>
      <Button variant="subtle" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function EmptyState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-white/[0.12] px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime/10 text-lime">{icon}</div>
      <p className="mt-4 max-w-[320px] text-[15.5px] text-fg/90">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageTitle({ label, title, right }: { label: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <p className="label">[ {label} ]</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.04em] md:text-[40px]">{title}</h1>
      </div>
      {right}
    </div>
  );
}
