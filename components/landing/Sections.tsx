"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Clock3, FileDown, Ghost, KeyRound, Mic, Music2, Printer, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal, useInView } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { Cta } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Label({ children, dark = true }: { children: string; dark?: boolean }) {
  return <p className={cn("label", !dark && "!text-[#6b6d64]")}>[ {children} ]</p>;
}
function H2({ a, b, dark = true }: { a: string; b?: string; dark?: boolean }) {
  return (
    <h2 className="h-display mt-4 text-[40px] md:text-[60px]">
      {a}
      {b && (
        <>
          <br />
          <span className={dark ? "h-grad" : "text-[#8d8f86]"}>{b}</span>
        </>
      )}
    </h2>
  );
}

/** A ticking clock for the loops. */
function useTick(ms: number, active = true) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms, active]);
  return n;
}

// ---------------- problem ----------------
export function Problem() {
  const items = [
    { icon: Ghost, t: "The melody is gone by morning", d: "You hum it once in the car. By the time you sit down with your guitar, it has faded into something else." },
    { icon: Clock3, t: "Hours lost finding chords by ear", d: "Rewind, guess a chord, rewind again. One chorus can eat a whole evening you wanted to spend writing." },
    { icon: Music2, t: "Theory gets in the way", d: "You don't need to read a staff to write a great song. But your bandmates need something they can play." },
  ];
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 md:px-8 md:py-[120px]">
      <Reveal>
        <Label>THE PROBLEM</Label>
        <H2 a="Your best ideas die" b="in your voice memos." />
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {items.map(({ icon: I, t, d }, i) => (
          <Reveal key={t} delay={i * 60} className="card rounded-[22px] p-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-coral/12 text-coral ring-1 ring-coral/25">
              <I className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">{t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------- how it works ----------------
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto h-[300px] w-[160px] rounded-[30px] bg-[#0b0b0a] p-[6px] ring-1 ring-white/15 shadow-[0_30px_60px_-25px_rgba(0,0,0,.9)]">
      <div className="relative h-full w-full overflow-hidden rounded-[25px] bg-[#101110]">
        <div className="absolute left-1/2 top-2 z-10 h-[14px] w-[48px] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

function StepRecord({ on }: { on: boolean }) {
  const n = useTick(120, on);
  return (
    <PhoneFrame>
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 rounded-full ring-2 ring-coral/60" style={{ transform: `scale(${1 + 0.12 * Math.abs(Math.sin(n / 3))})` }} />
          <span className="grid h-16 w-16 place-items-center rounded-full bg-coral text-ink">
            <Mic className="h-7 w-7" />
          </span>
        </div>
        <p className="mt-4 font-mono text-[12px] text-fg tabular">0:{String(4 + (n % 20) / 2).padStart(2, "0").slice(0, 2)}</p>
        <div className="mt-3 flex h-8 items-center gap-[2px]">
          {Array.from({ length: 22 }).map((_, k) => (
            <span key={k} className="w-[3px] rounded-full bg-coral" style={{ height: `${(20 + 80 * Math.abs(Math.sin(k * 0.8 + n / 2))).toFixed(1)}%` }} />
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
function StepConvert({ on }: { on: boolean }) {
  const n = useTick(90, on);
  const pct = Math.min(99, (n * 3) % 130);
  const notes = [3, 5, 6, 5, 8, 7, 6, 5, 4, 6, 5, 3];
  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-3 pt-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Writing…</p>
        <p className="text-[30px] font-semibold leading-none text-lime tabular">{pct}%</p>
        <div className="relative mt-4 h-28 rounded-xl bg-black/50 ring-1 ring-white/[0.06]">
          {notes.map((y, i) =>
            i / notes.length < pct / 100 ? (
              <span key={i} className="absolute h-[6px] rounded-full bg-lime" style={{ left: `${4 + i * 7.8}%`, width: "7%", top: `${88 - y * 10}%` }} />
            ) : null,
          )}
        </div>
        <ul className="mt-3 space-y-1.5 text-[10px]">
          {["Finding every pitch", "Detecting the key", "Matching the chords"].map((s, i) => (
            <li key={s} className={cn("flex items-center gap-1.5", pct > 30 + i * 25 ? "text-fg" : "text-dim")}>
              <span className={cn("grid h-3 w-3 place-items-center rounded-full", pct > 30 + i * 25 ? "bg-lime text-ink" : "ring-1 ring-white/20")}>
                {pct > 30 + i * 25 && <Check className="h-2 w-2" strokeWidth={4} />}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </PhoneFrame>
  );
}
function StepExport({ on }: { on: boolean }) {
  const n = useTick(1400, on);
  return (
    <PhoneFrame>
      <div className="flex h-full flex-col items-center justify-center px-4">
        <motion.div key={n} initial={{ y: 14, opacity: 0, rotate: -3 }} animate={{ y: 0, opacity: 1, rotate: 0 }} className="w-full rounded-lg bg-white p-2.5 text-ink shadow-xl">
          <p className="text-[9px] font-bold">Late-night idea</p>
          <p className="text-[7px] text-[#666]">A minor · 92 BPM</p>
          {[0, 1, 2].map((r) => (
            <div key={r} className="mt-1.5">
              <p className="text-[7px] font-bold text-[#5a8000]">{["Am", "F", "C", "G"][(r + n) % 4]}</p>
              {[0, 1, 2, 3, 4].map((l) => (
                <div key={l} className="mt-[2px] h-px bg-[#bbb]" />
              ))}
            </div>
          ))}
        </motion.div>
        <span className="mt-4 flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-[11px] font-semibold text-ink">
          <FileDown className="h-3 w-3" /> Download PDF
        </span>
      </div>
    </PhoneFrame>
  );
}

export function HowItWorks() {
  const [ref, on] = useInView<HTMLDivElement>("0px");
  const steps = [
    { n: "01", t: "Record", d: "Sing, hum or play your melody into your phone or laptop. Or upload a voice memo you already have.", v: <StepRecord on={on} /> },
    { n: "02", t: "Convert", d: "MelodyFlow finds every pitch, locks the tempo, detects the key and picks the chords. In seconds.", v: <StepConvert on={on} /> },
    { n: "03", t: "Export", d: "Save your song sheet as a PDF, change the key, and start recording your track.", v: <StepExport on={on} /> },
  ];
  return (
    <section id="how" className="scroll-mt-24 bg-paper text-paper-ink">
      <div ref={ref} className="mx-auto max-w-[1120px] px-5 py-16 md:px-8 md:py-[120px]">
        <Reveal>
          <Label dark={false}>HOW IT WORKS</Label>
          <H2 a="Hum. Wait 5 seconds." b="Play it from the sheet." dark={false} />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 60} className="rounded-[24px] bg-[#0d0e0b] p-6 text-fg">
              <div className="py-4">{s.v}</div>
              <p className="mt-4 font-mono text-[12px] text-lime">{s.n}</p>
              <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- features ----------------
function LoopTranscribe({ on }: { on: boolean }) {
  const n = useTick(160, on);
  const notes = [2, 4, 5, 4, 7, 6, 5, 4];
  const shown = n % (notes.length + 6);
  return (
    <div className="relative h-36">
      <div className="absolute inset-x-0 top-2 flex h-10 items-center gap-[3px]">
        {Array.from({ length: 48 }).map((_, k) => (
          <span key={k} className="w-[3px] rounded-full bg-white/25" style={{ height: `${(20 + 70 * Math.abs(Math.sin(k * 0.55))).toFixed(1)}%`, background: k / 48 < shown / notes.length ? "#C8FF3D" : undefined }} />
        ))}
      </div>
      <svg viewBox="0 0 300 80" className="absolute inset-x-0 bottom-0 w-full">
        {[0, 1, 2, 3, 4].map((l) => (
          <line key={l} x1="0" x2="300" y1={20 + l * 10} y2={20 + l * 10} stroke="rgba(255,255,255,.25)" />
        ))}
        {notes.slice(0, shown).map((y, i) => (
          <g key={i}>
            <ellipse cx={20 + i * 36} cy={64 - y * 5} rx="6" ry="4.5" fill="#C8FF3D" />
            <line x1={26 + i * 36} x2={26 + i * 36} y1={64 - y * 5} y2={38 - y * 5} stroke="#C8FF3D" strokeWidth="1.6" />
          </g>
        ))}
      </svg>
    </div>
  );
}
function LoopChords({ on }: { on: boolean }) {
  const n = useTick(1100, on);
  const prog = [
    ["C", "G", "Am", "F"],
    ["Am", "F", "C", "G"],
    ["D", "A", "Bm", "G"],
  ][n % 3];
  return (
    <div className="flex h-36 items-center justify-center gap-2">
      {prog.map((c, i) => (
        <motion.span key={c + i + n} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }} className="grid h-16 w-16 place-items-center rounded-2xl bg-lime/10 text-[22px] font-semibold text-lime ring-1 ring-lime/30">
          {c}
        </motion.span>
      ))}
    </div>
  );
}
function LoopPdf({ on }: { on: boolean }) {
  const n = useTick(1600, on);
  return (
    <div className="relative flex h-36 items-center justify-center">
      <motion.div key={n} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", damping: 16 }} className="w-28 rounded-md bg-white p-2 shadow-xl">
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="mb-1.5">
            {[0, 1, 2, 3, 4].map((l) => (
              <div key={l} className="mt-[2px] h-px bg-[#bbb]" />
            ))}
          </div>
        ))}
      </motion.div>
      <Printer className="absolute bottom-1 right-6 h-7 w-7 text-muted" />
    </div>
  );
}
function LoopKey({ on }: { on: boolean }) {
  const n = useTick(1000, on);
  const keys = ["C", "D", "E", "F", "G", "A"];
  const k = n % keys.length;
  return (
    <div className="flex h-36 flex-col items-center justify-center">
      <div className="flex gap-1.5">
        {keys.map((x, i) => (
          <span key={x} className={cn("grid h-10 w-10 place-items-center rounded-xl text-[15px] font-semibold transition-all duration-300", i === k ? "scale-110 bg-lime text-ink" : "bg-white/[0.05] text-muted")}>
            {x}
          </span>
        ))}
      </div>
      <p className="mt-4 font-mono text-[12px] text-muted">Capo {[0, 2, 4, 5, 0, 2][k] || "—"} · {keys[k]} major</p>
    </div>
  );
}

export function Features() {
  const [ref, on] = useInView<HTMLDivElement>("0px");
  const f = [
    { i: Wand2, t: "Voice Transcription", d: "Record your hums or instrument riffs and watch them turn into notes and guitar tab.", v: <LoopTranscribe on={on} /> },
    { i: Music2, t: "Chord Finder", d: "Automatically picks chords that fit your melody, bar by bar.", v: <LoopChords on={on} /> },
    { i: FileDown, t: "Export to PDF", d: "Download clean sheets to print or share with your bandmates.", v: <LoopPdf on={on} /> },
    { i: KeyRound, t: "Key Changer", d: "Move your song to any key in one tap, with a capo hint for easy shapes.", v: <LoopKey on={on} /> },
  ];
  return (
    <section id="features" className="scroll-mt-24">
      <div ref={ref} className="mx-auto max-w-[1120px] px-5 py-16 md:px-8 md:py-[120px]">
        <Reveal>
          <Label>FEATURES</Label>
          <H2 a="Everything between the hum" b="and the first take." />
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {f.map(({ i: I, t, d, v }, k) => (
            <Reveal key={t} delay={k * 60} className="card overflow-hidden rounded-[24px] p-6">
              <div className="rounded-[18px] bg-black/40 p-4 ring-1 ring-white/[0.05]">{v}</div>
              <div className="mt-5 flex items-center gap-2.5">
                <I className="h-5 w-5 text-lime" />
                <h3 className="text-[20px] font-semibold tracking-[-0.02em]">{t}</h3>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- what changes (true product facts) ----------------
export function Changes() {
  const facts = [
    { n: 5, s: " s", t: "from hum to song sheet", d: "For a short melody, on a normal phone." },
    { n: 12, s: "", t: "keys, one tap away", d: "Move a song up or down to fit your voice." },
    { n: 0, s: " bytes", t: "of audio uploaded", d: "Your recording stays on your device. Only the notes go to our server." },
    { n: 3, s: "", t: "free song sheets a day", d: "Try it on your own melodies before you pay a cent." },
  ];
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-16 md:px-8 md:py-[120px]">
      <Reveal>
        <Label>WHAT CHANGES</Label>
        <H2 a="Write it down tonight." b="Play it tomorrow." />
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-white/[0.08] md:grid-cols-4">
        {facts.map((f, i) => (
          <Reveal key={f.t} delay={i * 60} className="bg-ink p-5 md:p-7">
            <p className="text-[44px] font-semibold leading-none tracking-[-0.05em] text-lime tabular md:text-[56px]">
              <CountUp to={f.n} />
              <span className="text-[20px] text-fg/70 md:text-[24px]">{f.s}</span>
            </p>
            <p className="mt-3 text-[15px] font-medium">{f.t}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{f.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------- comparison ----------------
export function Compare() {
  const rows = [
    ["Capture the idea", "Voice memo #47, never opened", "A song sheet you can read"],
    ["Find the chords", "Hours of rewinding and guessing", "Detected in seconds"],
    ["Change the key", "Rewrite every note by hand", "One tap, with a capo hint"],
    ["Share with the band", "\"It goes like… da-da-daa\"", "A clean PDF they can play"],
    ["Theory needed", "Some, or a teacher", "None: note names under every note"],
  ];
  return (
    <section className="bg-paper text-paper-ink">
      <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-8 md:py-[120px]">
        <Reveal>
          <Label dark={false}>THE USUAL WAY VS MELODYFLOW</Label>
          <H2 a="Stop transcribing." b="Start writing." dark={false} />
        </Reveal>
        <Reveal className="mt-12 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.07]">
          <div className="grid grid-cols-[1fr_1fr] border-b border-black/[0.07] text-[13px] font-semibold md:grid-cols-[1fr_1.3fr_1.3fr]">
            <div className="hidden p-5 md:block" />
            <div className="p-4 text-[#8d8f86] md:p-5">The usual way</div>
            <div className="bg-[#0d0e0b] p-4 text-lime md:p-5">With MelodyFlow</div>
          </div>
          {rows.map(([a, b, c]) => (
            <div key={a} className="grid grid-cols-[1fr_1fr] border-b border-black/[0.06] last:border-0 md:grid-cols-[1fr_1.3fr_1.3fr]">
              <div className="col-span-2 px-4 pt-4 text-[13px] font-semibold text-[#6b6d64] md:col-span-1 md:p-5 md:text-[15px] md:text-paper-ink">{a}</div>
              <div className="flex gap-2 p-4 text-[14px] text-[#55574f] md:p-5 md:text-[15px]">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-coral" /> {b}
              </div>
              <div className="flex gap-2 bg-[#0d0e0b] p-4 text-[14px] text-fg md:p-5 md:text-[15px]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> {c}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- FAQ ----------------
const QA = [
  {
    q: "Do I need to know music theory?",
    a: "No. Every note shows its letter name, the guitar tab shows which fret to press, and the chords are written above each bar. If you can hum it, you can read it.",
  },
  {
    q: "What can I record?",
    a: "One melody at a time: humming, singing, whistling, or a single instrument like guitar, piano or violin. It isn't made for full band recordings or chords strummed all at once. For those, hum the melody on its own.",
  },
  {
    q: "How accurate is it?",
    a: "Very good on clear, steady notes, which is most hums. Fast runs and heavy vibrato can be simplified. Every sheet shows the notes it heard, so you can play it back against your memory and check.",
  },
  {
    q: "Does my recording get uploaded?",
    a: "No. Your audio is analyzed right in your browser and never leaves your device. Only the notes (pitches and timing) are sent to our server to write your sheet. You can delete any sheet at any time.",
  },
  {
    q: "Does it work on my iPhone?",
    a: "Yes. MelodyFlow runs in Safari and Chrome on iPhone, Android and computers. You can also upload a voice memo you recorded earlier. There's no app to install, but you can add it to your home screen.",
  },
  {
    q: "How much does it cost?",
    a: "You try it free first. The plans show up once your first song sheet is ready.",
  },
];
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-[860px] scroll-mt-24 px-5 py-16 md:px-8 md:py-[120px]">
      <Reveal>
        <Label>QUESTIONS</Label>
        <H2 a="The honest answers." />
      </Reveal>
      <div className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {QA.map((x, i) => (
          <div key={x.q}>
            <button className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-medium tracking-[-0.01em] md:text-[19px]" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              {x.q}
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition", open === i && "rotate-180 text-lime")} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pb-5 pr-8 text-[15.5px] leading-relaxed text-muted">
                  {x.a}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------- final CTA ----------------
export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="top-glow absolute inset-0" />
      <div className="dot-grid absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-[1120px] px-5 py-20 text-center md:px-8 md:py-[140px]">
        <Reveal>
          <Label>TONIGHT</Label>
          <h2 className="h-display mx-auto mt-4 max-w-[820px] text-[42px] md:text-[72px]">
            Hum it once tonight.
            <br />
            <span className="h-grad">Play it from the sheet tomorrow.</span>
          </h2>
          <div className="mt-10 flex justify-center">
            <Cta href="#try">Make my song sheet</Cta>
          </div>
          <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">Free to try · No card · Ready in seconds</p>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- sticky main button on phones ----------------
export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const t = document.getElementById("try");
      if (!t) return;
      const r = t.getBoundingClientRect();
      setShow(r.bottom < 0 && window.innerHeight + window.scrollY < document.body.scrollHeight - 700);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden">
          <Cta href="#try" className="w-full">
            Make my song sheet
          </Cta>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
