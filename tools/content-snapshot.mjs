// Usage: node tools/content-snapshot.mjs <url> <out.json> [--html out.html]
// Records the visible text of every section, the nav menu and each project
// modal after all scripts have run, so legacy and new builds can be compared.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const [, , url = "http://127.0.0.1:4310/", out = "content.json", flag, htmlOut] = process.argv;
const norm = (s) => s.replace(/\s+/g, " ").trim();

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => { const l = document.getElementById("ld"); return !l || l.classList.contains("gone"); }, null, { timeout: 20000 });

const snap = await page.evaluate(() => {
  const t = (el) => (el ? el.textContent : "");
  const o = { sections: {}, menu: t(document.getElementById("menu")), footer: t(document.querySelector("footer")), title: document.title };
  document.querySelectorAll("[data-s]").forEach((s) => (o.sections[s.id] = { n: s.dataset.n, text: t(s) }));
  o.cards = [...document.querySelectorAll("#stage .pc")].map((c) => c.getAttribute("aria-label"));
  return o;
});
for (const k in snap.sections) snap.sections[k].text = norm(snap.sections[k].text);
snap.menu = norm(snap.menu);
snap.footer = norm(snap.footer);

// Open every project modal (bring each card to front first, then click it).
snap.modals = [];
const n = snap.cards.length;
for (let i = 0; i < n; i++) {
  await page.evaluate((i) => {
    const cards = document.querySelectorAll("#stage .pc");
    for (let k = 0; k < cards.length; k++) {
      if (cards[i].classList.contains("c")) break;
      document.getElementById("nx").click();
    }
    cards[i].click();
  }, i);
  await page.waitForTimeout(1400); // counters finish at 1.1s
  snap.modals.push(norm(await page.evaluate(() => document.getElementById("mc").textContent)));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}
writeFileSync(out, JSON.stringify(snap, null, 2));
if (flag === "--html") writeFileSync(htmlOut, await page.evaluate(() => document.body.outerHTML));
await browser.close();
console.log("sections", Object.keys(snap.sections).length, "modals", snap.modals.length);
