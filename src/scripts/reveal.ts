// Scroll reveals: one shared IntersectionObserver adds `.in` to every `.rv` element.
// Other modules can hook in with onReveal() instead of creating their own observers.
import { $$ } from "./lib/env";

type Hook = (el: Element) => void;
const hooks = new Map<Element, Hook[]>();

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      io.unobserve(e.target);
      hooks.get(e.target)?.forEach((h) => h(e.target));
      hooks.delete(e.target);
    }
  },
  { threshold: 0.06 },
);

/** Calls `cb` once, when `el` is first revealed. `el` must be a `.rv` element. */
export function onReveal(el: Element, cb: Hook) {
  if (el.classList.contains("in")) return cb(el);
  hooks.set(el, [...(hooks.get(el) ?? []), cb]);
}

// Stagger index for panel content: direct children first, then list rows (offset by 2),
// which matches the order the original script applied them in.
for (const p of $$(".panel")) Array.from(p.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i)));
for (const e of $$(".ed,.xp,.act,.aw,.lst>div,.sk>div"))
  e.style.setProperty("--i", String(Array.prototype.indexOf.call(e.parentElement!.children, e) + 2));

$$(".rv").forEach((el, i) => {
  el.style.transitionDelay = (i % 3) * 0.08 + "s";
  io.observe(el);
});
