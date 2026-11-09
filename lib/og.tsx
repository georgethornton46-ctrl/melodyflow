import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

type Mini = { m: number; s: number }[];

export function ogImage({ title, line, notes, chords }: { title: string; line: string; notes: Mini; chords?: string[] }) {
  const lo = Math.min(60, ...notes.map((n) => n.m));
  const hi = Math.max(72, ...notes.map((n) => n.m));
  const end = Math.max(32, ...notes.map((n) => n.s + 2));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "radial-gradient(90% 90% at 0% 0%, rgba(200,255,61,.25), transparent 55%), radial-gradient(80% 80% at 100% 0%, rgba(91,108,255,.45), transparent 60%), radial-gradient(80% 80% at 60% 100%, rgba(255,107,74,.28), transparent 60%), #0a0a0a",
          color: "#F4F5EF",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#C8FF3D", display: "flex", alignItems: "center", justifyContent: "center", color: "#060606", fontSize: 28, fontWeight: 800 }}>♪</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>MelodyFlow</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 22, letterSpacing: 5, color: "rgba(244,245,239,.7)" }}>[ SONG SHEET ]</div>
          <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -3, marginTop: 10, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 28, color: "rgba(244,245,239,.75)", marginTop: 14 }}>{line}</div>
        </div>
        <div style={{ position: "relative", display: "flex", marginTop: "auto", height: 170, borderRadius: 24, background: "rgba(0,0,0,.45)", border: "1px solid rgba(255,255,255,.1)" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: 30, right: 30, top: 45 + i * 18, height: 2, background: "rgba(255,255,255,.25)" }} />
          ))}
          {(chords || []).slice(0, 6).map((c, i) => (
            <div key={i} style={{ position: "absolute", top: 8, left: 40 + i * 180, fontSize: 24, fontWeight: 700, color: "#C8FF3D" }}>{c}</div>
          ))}
          {notes.slice(0, 40).map((n, i) => (
            <div key={i} style={{ position: "absolute", left: 40 + (n.s / end) * 1000, top: 135 - ((n.m - lo) / Math.max(1, hi - lo)) * 100, width: 20, height: 15, borderRadius: 10, background: "#C8FF3D" }} />
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
