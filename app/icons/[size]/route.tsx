import { ImageResponse } from "next/og";

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = size === "512" ? 512 : size === "180" ? 180 : 192;
  return new ImageResponse(<Icon s={s} />, { width: s, height: s });
}

function Icon({ s }: { s: number }) {
  const k = s / 32;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#C8FF3D", position: "relative" }}>
      {[
        [6, 15, 2],
        [9.5, 12, 8],
        [13, 14, 4],
      ].map(([x, y, h], i) => (
        <div key={i} style={{ position: "absolute", left: (x - 1.1) * k, top: y * k, width: 2.2 * k, height: h * k, borderRadius: k, background: "#060606" }} />
      ))}
      <div style={{ position: "absolute", left: 15.9 * k, top: 8.5 * k, width: 2.2 * k, height: 13 * k, background: "#060606", borderRadius: k }} />
      <div style={{ position: "absolute", left: 15.9 * k, top: 7.5 * k, width: 9.2 * k, height: 2.4 * k, background: "#060606", borderRadius: k, transform: "rotate(-14deg)", transformOrigin: "left" }} />
      <div style={{ position: "absolute", left: 12.6 * k, top: 19.7 * k, width: 5.2 * k, height: 4.2 * k, background: "#060606", borderRadius: 9 * k }} />
    </div>
  );
}
