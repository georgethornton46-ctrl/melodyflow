// Viewport-by-viewport screenshots: node scripts/screens.mjs /path name width height count
import { chromium } from "playwright";
import fs from "node:fs";
const [path = "/", name = "s", w = "390", h = "844", count = "6"] = process.argv.slice(2);
const base = process.env.BASE || "http://localhost:3000";
fs.mkdirSync(".shots", { recursive: true });
const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await ctx.newPage();
await page.goto(base + path, { waitUntil: "networkidle" });
const start = +(process.env.START || 0);
for (let i = 0; i < +count; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), (start + i) * +h * 0.9);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `.shots/${name}-${i}.png` });
}
await browser.close();
