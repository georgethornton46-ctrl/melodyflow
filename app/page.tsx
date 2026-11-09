import { TopBar } from "@/components/landing/TopBar";
import { Footer } from "@/components/landing/Footer";
import { Vsl } from "@/components/landing/Vsl";
import { Changes, Compare, Faq, Features, FinalCta, HowItWorks, Problem, StickyCta } from "@/components/landing/Sections";
import { TryFlow } from "@/components/funnel/TryFlow";
import { UnlockProvider } from "@/components/funnel/UnlockProvider";
import { KwopFlow } from "@/components/landing/KwopFlow";
import { Reveal } from "@/components/ui/reveal";
import { supabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 600;

async function sheetCount(): Promise<number | null> {
  try {
    const { count } = await supabaseAdmin().from("sheets").select("id", { count: "exact", head: true });
    return count ?? null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const count = await sheetCount();
  return (
    <UnlockProvider>
      <KwopFlow />
      <TopBar />
      <main>
        <section className="relative overflow-hidden">
          <div className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
          <div className="top-glow pointer-events-none absolute inset-x-0 top-0 h-[700px]" />
          <div className="relative mx-auto max-w-[1120px] px-4 pb-16 pt-[112px] md:px-8 md:pb-24 md:pt-[150px]">
            <div className="mx-auto max-w-[860px] text-center">
              <p className="label">[ VOICE MEMO → SONG SHEET ]</p>
              <h1 className="h-display mt-5 text-[44px] md:text-[78px]">
                Hum it. Get the sheet music.
                <br />
                <span className="h-grad">In 5 seconds.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[540px] text-[17px] leading-relaxed text-muted md:text-[19px]">
                Turn a random voice memo into <b className="font-semibold text-fg">notes</b>, <b className="font-semibold text-fg">guitar tab</b> and chords. Try it right here, no account needed.
              </p>
            </div>
            <div className="mt-9 md:mt-12">
              <TryFlow />
            </div>
            <p className="mt-6 text-center font-mono text-[11.5px] uppercase tracking-[0.14em] text-muted">
              Your audio stays on your device · Free to try · No card
            </p>
            {count !== null && count >= 500 && (
              <p className="mt-2 text-center font-mono text-[11.5px] uppercase tracking-[0.14em] text-dim">
                {count.toLocaleString("en-US")}+ song sheets written so far
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] px-4 pb-8 md:px-8">
          <Reveal>
            <p className="label text-center">[ WATCH: 60 SECONDS ]</p>
            <h2 className="h-display mx-auto mt-3 max-w-[760px] text-center text-[34px] md:text-[52px]">
              How I turn a random voice memo into a full song sheet.
            </h2>
          </Reveal>
          <Reveal className="mx-auto mt-10 max-w-[960px]">
            <Vsl />
          </Reveal>
        </section>

        <Problem />
        <HowItWorks />
        <Features />
        <Changes />
        <Compare />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </UnlockProvider>
  );
}
