// Usage: node tools/screenshots.mjs <baseUrl> <outDir> [contactPath]
// Captures full-page + per-section screenshots at three viewports.
// Two sets: "live" (as rendered) and "static" (random background canvases hidden,
// animations settled) so the static set can be pixel-diffed between builds.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , base = "http://localhost:4310", out = "baseline", contactPath = "/contact.html"] = process.argv;
const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900, touch: false },
  { name: "768x1024", width: 768, height: 1024, touch: true },
  { name: "390x844", width: 390, height: 844, touch: true },
];
const SECTIONS = ["home", "about", "education", "skills", "credentials", "experience", "research", "projects", "awards", "contact"];
const HIDE_RANDOM = `canvas#c, #bg3d, canvas#cn5, #cn5, canvas#bgc { visibility: hidden !important; }`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settle(page) {
  // Wait for the loader to be gone (legacy: .gone class, new: element removed).
  await page.waitForFunction(() => {
    const ld = document.getElementById("ld");
    return !ld || ld.classList.contains("gone") || getComputedStyle(ld).display === "none";
  }, null, { timeout: 15000 });
  // Scroll the whole page so every IntersectionObserver reveal fires.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = page.viewportSize().height;
  for (let y = 0; y <= h; y += Math.round(vh * 0.5)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(2600); // reveal transitions + panel "live" delay (1.7s)
}

const browser = await chromium.launch({ channel: "chrome" });
for (const vp of VIEWPORTS) {
  for (const mode of ["live", "static"]) {
    const dir = join(out, mode, vp.name);
    mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      hasTouch: vp.touch,
      isMobile: vp.touch && vp.width < 800,
    });
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    if (mode === "static") await page.addStyleTag({ content: HIDE_RANDOM });
    await settle(page);
    await page.screenshot({ path: join(dir, "full.png"), fullPage: true });
    for (const id of SECTIONS) {
      const ok = await page.evaluate((i) => {
        const el = document.getElementById(i);
        if (!el) return false;
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY);
        return true;
      }, id);
      if (!ok) continue;
      await sleep(1200);
      await page.screenshot({ path: join(dir, `section-${id}.png`) });
    }
    // contact page
    await page.goto(base + contactPath, { waitUntil: "load" });
    if (mode === "static") await page.addStyleTag({ content: HIDE_RANDOM + " iframe{visibility:hidden!important}" });
    await sleep(2500);
    await page.screenshot({ path: join(dir, "contact-full.png"), fullPage: true });
    await ctx.close();
    console.log("done", mode, vp.name);
  }
}
await browser.close();
