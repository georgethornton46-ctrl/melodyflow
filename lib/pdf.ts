"use client";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { StaffView } from "@/components/music/StaffView";
import { keyName, usesFlats, type Note, type Sheet } from "./music";

/** Draws the sheet (black on white) and saves a print-ready PDF. */
export async function downloadPdf(opts: {
  title: string;
  notes: Note[];
  chords: string[];
  key: Sheet["key"];
  bpm: number;
  bars: number;
  mode: "both" | "notes" | "tab";
  showNames: boolean;
}) {
  const { jsPDF } = await import("jspdf");
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:1000px;background:#fff";
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() =>
    root.render(
      createElement(StaffView, {
        notes: opts.notes,
        chords: opts.chords,
        bars: opts.bars,
        flats: usesFlats(opts.key),
        mode: opts.mode,
        showNames: opts.showNames,
        barsPerLine: 4,
        forExport: true,
      }),
    ),
  );
  const svg = host.querySelector("svg")!;
  const vb = svg.viewBox.baseVal;
  const xml = new XMLSerializer().serializeToString(svg);
  root.unmount();
  host.remove();
  const img = new Image();
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("render"));
    img.src = url;
  });
  const scale = 2.4;
  const canvas = document.createElement("canvas");
  canvas.width = vb.width * scale;
  canvas.height = vb.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 44;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(opts.title, m, m + 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(90);
  pdf.text(`${keyName(opts.key)}  ·  ${opts.bpm} BPM  ·  4/4  ·  ${opts.bars} bars`, m, m + 36);
  pdf.setTextColor(0);
  // slice the drawing across pages
  const w = pw - m * 2;
  const pxPerPt = canvas.width / w;
  let y = m + 56;
  let sy = 0;
  while (sy < canvas.height) {
    const room = ph - m - y;
    const sysPx = canvas.height / Math.max(1, Math.ceil(opts.bars / 4));
    const fit = Math.max(1, Math.floor((room * pxPerPt) / sysPx));
    const slicePx = Math.min(canvas.height - sy, Math.round(fit * sysPx));
    const part = document.createElement("canvas");
    part.width = canvas.width;
    part.height = slicePx;
    part.getContext("2d")!.drawImage(canvas, 0, sy, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
    pdf.addImage(part.toDataURL("image/png"), "PNG", m, y, w, slicePx / pxPerPt);
    sy += slicePx;
    if (sy < canvas.height) {
      pdf.addPage();
      y = m;
    }
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150);
    pdf.text("Written with MelodyFlow", m, ph - 22);
  }
  const safe = opts.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "song-sheet";
  pdf.save(`${safe}.pdf`);
}
