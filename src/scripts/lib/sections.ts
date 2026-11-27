// Section geometry shared by the nav (active section) and the 3D background (scroll progress).
export const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-s]"));
let tops: number[] = [];

export function measure() {
  tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
  tops.push(document.documentElement.scrollHeight);
}

measure();
addEventListener("resize", measure);
addEventListener("load", measure);
if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);

/** Index of the section under the middle of the viewport, plus fractional progress through it. */
export function sectionAt(y = scrollY) {
  const mid = y + innerHeight * 0.5;
  let i = 0;
  for (let k = 0; k < sections.length; k++) if (mid >= tops[k]) i = k;
  const frac = Math.max(0, Math.min(1, (mid - tops[i]) / Math.max(1, tops[i + 1] - tops[i])));
  return { index: i, progress: i + frac };
}
