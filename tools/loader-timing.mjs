// Usage: node tools/loader-timing.mjs <url> [runs]
// Measures loader milestones (ms since navigation start):
//   exitStart   – #ld gets class "out"
//   interactive – body/html loses class "ld" (scroll unlocked, page usable)
//   gone        – #ld hidden (.gone) or removed from the DOM
// Runs unthrottled and with Slow 4G + 4x CPU slowdown.
import { chromium } from "playwright";

const [, , url = "http://127.0.0.1:4310/", runsArg = "5"] = process.argv;
const RUNS = +runsArg;

const probe = () => {
  const t = {};
  window.__ld = t;
  const mark = (k) => { if (!(k in t)) t[k] = Math.round(performance.now()); };
  new MutationObserver(() => {
    const ld = document.getElementById("ld");
    if (ld && ld.classList.contains("out")) mark("exitStart");
    // Legacy locks with body.ld, the new build with html.ld.
    const locked = document.documentElement.classList.contains("ld") || !!document.body?.classList.contains("ld");
    if (t.sawLd && !locked) mark("interactive");
    if (locked) t.sawLd = true;
    if (t.sawEl && (!ld || ld.classList.contains("gone"))) mark("gone");
    if (ld) t.sawEl = true;
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
};

async function run(throttle) {
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    // Lighthouse "Slow 4G": 150ms RTT, 1.6 Mbps down, 750 Kbps up
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await page.addInitScript(probe);
  await page.goto(url, { waitUntil: "commit" });
  await page.waitForFunction(() => window.__ld && "gone" in window.__ld, null, { timeout: 30000 }).catch(() => {});
  const t = await page.evaluate(() => window.__ld);
  await browser.close();
  return { exitStart: t.exitStart, interactive: t.interactive, gone: t.gone };
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const throttle of [false, true]) {
  const rs = [];
  for (let i = 0; i < (throttle ? Math.max(1, Math.ceil(RUNS / 2)) : RUNS); i++) rs.push(await run(throttle));
  const keys = ["exitStart", "interactive", "gone"];
  const med = Object.fromEntries(keys.map((k) => [k, median(rs.map((r) => r[k] ?? NaN))]));
  console.log(throttle ? "Slow 4G + 4x CPU" : "Unthrottled", JSON.stringify({ median: med, runs: rs }));
}
