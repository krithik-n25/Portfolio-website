// Usage: node tools/loader-frames.mjs <url> <outDir>
// Screenshots the loader mid-count, 300ms after the exit starts and 1.5s after, and scans
// each exit frame for a bright full-width horizontal line (the old seam bug).
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , url = "http://127.0.0.1:4320/", out = "compare/loader"] = process.argv;
mkdirSync(out, { recursive: true });

/** Rows where >50% of pixels are near-white: a horizontal line across the screen
 *  (the seam fades out over its outer 20% on each side). */
async function brightRows(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  for (let y = 0; y < info.height; y++) {
    let n = 0;
    for (let x = 0; x < info.width; x++) if (data[y * info.width + x] > 200) n++;
    if (n / info.width > 0.5) rows.push(y);
  }
  return rows;
}

const browser = await chromium.launch({ channel: "chrome" });
for (const reduced of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const ld = document.getElementById("ld");
      if (ld?.classList.contains("out") && !window.__exit) window.__exit = performance.now();
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["class"] });
  });
  await page.goto(url, { waitUntil: "commit" });
  const tag = reduced ? "reduced-" : "";
  await page.waitForFunction(() => { const n = document.querySelector("#ld .n"); return n && parseInt(n.textContent, 10) > 40; }, null, { polling: "raf" });
  await page.screenshot({ path: join(out, `${tag}0-counting.png`) });
  await page.waitForFunction(() => window.__exit, null, { polling: "raf" });
  for (const ms of [300, 1500]) {
    await page.waitForFunction((ms) => performance.now() - window.__exit >= ms, ms, { polling: "raf" });
    const f = join(out, `${tag}exit+${ms}ms.png`);
    await page.screenshot({ path: f });
    const rows = await brightRows(f);
    const inDom = await page.evaluate(() => !!document.getElementById("ld"));
    console.log(`${reduced ? "reduced motion" : "default"} exit+${ms}ms: loader in DOM=${inDom}, full-width bright rows=${rows.length ? rows.join(",") : "none"}`);
  }
  await ctx.close();
}
await browser.close();
