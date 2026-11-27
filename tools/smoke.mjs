// Usage: node tools/smoke.mjs <baseUrl>
// Loads home + contact, reports console messages, page errors and failed requests,
// and whether the loader exited and the 3D canvas faded in.
import { chromium } from "playwright";

const [, , base = "http://127.0.0.1:4320"] = process.argv;
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const issues = [];
page.on("console", (m) => ["error", "warning"].includes(m.type()) && issues.push(`console.${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) => issues.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
page.on("response", (r) => r.status() >= 400 && issues.push(`HTTP ${r.status()}: ${r.url()}`));

await page.goto(base + "/", { waitUntil: "load" });
await page.waitForFunction(() => !document.getElementById("ld"), null, { timeout: 8000 }).catch(() => issues.push("loader still in DOM after 8s"));
await page.waitForTimeout(2500);
const state = await page.evaluate(() => ({
  htmlClass: document.documentElement.className,
  canvasOn: document.getElementById("c")?.classList.contains("on"),
  scrollLocked: getComputedStyle(document.body).overflow,
  cards: document.querySelectorAll("#stage .pc").length,
  counter: document.getElementById("pn")?.textContent,
  focused: document.activeElement?.id,
}));
console.log("home", JSON.stringify(state));
// open a project with screenshots, check its images load
await page.evaluate(() => document.getElementById("projects").scrollIntoView());
await page.waitForTimeout(800);
for (let i = 0; i < 3; i++) await page.click("#nx");
await page.waitForTimeout(1100);
await page.click("#stage .pc.c");
await page.waitForTimeout(1500);
console.log("modal", JSON.stringify(await page.evaluate(() => ({
  open: document.getElementById("modal").classList.contains("on"),
  title: document.querySelector("#mc h2")?.textContent,
  imgs: [...document.querySelectorAll("#mc img")].map((i) => [i.currentSrc.split("/").pop(), i.naturalWidth, i.complete]),
  focus: document.activeElement?.id,
}))));
await page.keyboard.press("Escape");
await page.goto(base + "/contact.html", { waitUntil: "load" });
await page.waitForTimeout(1500);
console.log("contact", JSON.stringify(await page.evaluate(() => ({ title: document.title, h1: document.querySelector("h1")?.getAttribute("aria-label") }))));
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(600);
console.log("return visit", JSON.stringify(await page.evaluate(() => ({ htmlClass: document.documentElement.className, loader: !!document.getElementById("ld") }))));
console.log(issues.length ? "ISSUES:\n" + issues.join("\n") : "no console errors, warnings or failed requests");
await browser.close();
