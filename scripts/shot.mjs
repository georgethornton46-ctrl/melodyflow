// Full-page screenshots at 390×844 and 1440×900 → .shots/
// usage: node scripts/shot.mjs /path [name] [--scroll]
import { chromium } from "playwright";
import fs from "node:fs";
const path = process.argv[2] || "/";
const name = process.argv[3] || (path.replace(/\W+/g, "_") || "home");
const base = process.env.BASE || "http://localhost:3000";
fs.mkdirSync(".shots", { recursive: true });
const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
for (const [w, h, tag] of [[390, 844, "m"], [1440, 900, "d"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base + path, { waitUntil: "networkidle" });
  // trigger reveals
  const H = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `.shots/${name}-${tag}.png`, fullPage: true });
  console.log(tag, "errors:", errors.length ? errors : "none");
  await ctx.close();
}
await browser.close();
