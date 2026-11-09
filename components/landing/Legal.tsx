import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <TopBar links={false} />
      <main className="mx-auto max-w-[720px] px-5 pb-20 pt-[110px] md:pt-[140px]">
        <p className="label">[ LEGAL ]</p>
        <h1 className="h-display mt-3 text-[40px] md:text-[56px]">{title}</h1>
        <p className="mt-2 text-[14px] text-muted">Last updated {updated}</p>
        <div className="mt-10 space-y-6 text-[15.5px] leading-relaxed text-fg/85 [&_h2]:mt-10 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
