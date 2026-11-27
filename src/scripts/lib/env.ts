// Shared environment checks and tiny DOM helpers.
export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const touch = matchMedia("(hover:none)").matches;

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Runs `cb` once the start-screen loader has started its exit (or right away if there is none). */
export function afterLoader(cb: () => void) {
  if (!document.documentElement.classList.contains("ld")) cb();
  else addEventListener("loader:done", cb, { once: true });
}

/** Runs `cb` when the main thread is idle, with a timeout fallback for Safari. */
export function whenIdle(cb: () => void, timeout = 1200) {
  if ("requestIdleCallback" in window) requestIdleCallback(cb, { timeout });
  else setTimeout(cb, 200);
}
