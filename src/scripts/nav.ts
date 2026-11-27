// Menu, dot rail, section counter and the top scroll progress bar.
import { $, $$, reduceMotion } from "./lib/env";
import { sections, sectionAt } from "./lib/sections";

const menuBtn = $("#bg")!;
const dots = $$("#dots button");
const links = $$<HTMLAnchorElement>("#menu a");
const cnt = $("#cnt");
const prog = $("#prog");
const pad = (x: number) => (x < 10 ? "0" : "") + x;

function closeMenu() {
  document.body.classList.remove("mopen");
  menuBtn.setAttribute("aria-expanded", "false");
}

menuBtn.addEventListener("click", () => {
  const open = document.body.classList.toggle("mopen");
  menuBtn.setAttribute("aria-expanded", String(open));
});
links.forEach((a) => a.addEventListener("click", closeMenu));
addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

dots.forEach((b) =>
  b.addEventListener("click", () =>
    sections[Number(b.dataset.i)].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }),
  ),
);

let active = 0;
function update() {
  const { index } = sectionAt();
  if (index !== active) {
    active = index;
    dots.forEach((b, q) => b.classList.toggle("on", q === index));
    links.forEach((a, q) => (q === index ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    if (cnt) cnt.textContent = `${pad(index + 1)} / ${pad(sections.length)} · ${sections[index].dataset.n}`;
  }
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  if (prog) prog.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
}

let queued = false;
const schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    update();
  });
};
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule, { passive: true });
update();
