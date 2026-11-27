// Animated metric counters (".mets b[data-v]"): counts up to the value over 1.1s with an
// ease-out cubic, keeping any prefix/suffix ("~42 ms", "34.2%", "<450 ms").
import { reduceMotion } from "./lib/env";

export function count(el: HTMLElement) {
  const v = el.dataset.v ?? "";
  const m = /^([^\d]*)([\d.]+)(.*)$/.exec(v);
  if (!m || reduceMotion) {
    el.textContent = v;
    return;
  }
  const to = parseFloat(m[2]);
  const dec = (m[2].split(".")[1] || "").length;
  const t0 = performance.now();
  const tick = (now: number) => {
    const u = Math.min(1, (now - t0) / 1100);
    const e = 1 - Math.pow(1 - u, 3);
    el.textContent = m[1] + (to * e).toFixed(dec) + m[3];
    if (u < 1) requestAnimationFrame(tick);
  };
  tick(t0);
}
