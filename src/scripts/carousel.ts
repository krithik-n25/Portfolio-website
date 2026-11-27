// Projects: 3D carousel, project detail modal, and the "Projects on screen" body flag.
import { $, $$, reduceMotion, touch } from "./lib/env";
import { count } from "./counters";

const sec = $("#projects")!;
const stage = $("#stage")!;
const modal = $("#modal")!;
const mc = $("#mc")!;
const mx = $<HTMLButtonElement>("#mx")!;
const counter = $("#pn")!;
const cards = $$(".pc", stage);
const n = cards.length;
let idx = Number(stage.dataset.start ?? 0);
let opener: HTMLElement | null = null;

const pad = (k: number) => (k < 10 ? "0" : "") + k;

function lay() {
  const m = innerWidth < 900;
  cards.forEach((c, i) => {
    const d = ((i - idx + n + 2) % n) - 2;
    const a = Math.abs(d);
    const sg = d < 0 ? -1 : 1;
    const far = a > 2; // with 6 cards, the one opposite the front waits hidden behind it
    const x = a === 0 || far ? 0 : sg * (a === 1 ? (m ? 70 : 62) : m ? 120 : 138);
    const z = -a * (m ? 340 : 280);
    const r = a === 0 || far ? 0 : -sg * (a === 1 ? (m ? 30 : 34) : m ? 34 : 38);
    c.classList.toggle("c", d === 0);
    c.style.zIndex = String(10 - a);
    c.style.opacity = String(a === 0 ? 1 : a === 1 ? 0.85 : far ? 0 : 0.6);
    c.style.pointerEvents = far ? "none" : "";
    c.tabIndex = far ? -1 : 0;
    c.setAttribute("aria-hidden", far ? "true" : "false");
    c.style.transform = `translateY(-50%) translateX(${x}%) translateZ(${z}px) rotateY(${r}deg)`;
  });
  counter.textContent = `${pad(idx + 1)} / ${pad(n)}`;
}

function go(i: number) {
  idx = (i + n) % n;
  lay();
}

function open(i: number) {
  const tpl = document.getElementById(`pd-${i}`) as HTMLTemplateElement | null;
  if (!tpl) return;
  opener = cards[i];
  mc.replaceChildren(tpl.content.cloneNode(true));
  modal.classList.add("on");
  document.body.classList.add("lock");
  modal.scrollTop = 0;
  $$(".mets b", mc).forEach(count);
  mx.focus();
  dispatchEvent(new Event("modal:open"));
}

function close() {
  if (!modal.classList.contains("on")) return;
  modal.classList.remove("on");
  document.body.classList.remove("lock");
  opener?.focus();
  dispatchEvent(new Event("modal:close"));
}

cards.forEach((c, i) => {
  const act = () => (i === idx ? open(i) : go(i));
  c.addEventListener("click", act);
  c.addEventListener("keydown", (e) => e.key === "Enter" && act());
  if (!touch && !reduceMotion) {
    const art = $<SVGElement>(".art svg", c);
    c.addEventListener(
      "pointermove",
      (e) => {
        if (!art) return;
        const r = c.getBoundingClientRect();
        art.style.setProperty("--tz", ((e.clientX - r.left) / r.width - 0.5) * 26 + "deg");
        art.style.setProperty("--tx", -((e.clientY - r.top) / r.height - 0.5) * 22 + "deg");
      },
      { passive: true },
    );
    c.addEventListener("pointerleave", () => {
      art?.style.setProperty("--tx", "0deg");
      art?.style.setProperty("--tz", "0deg");
    });
  }
});

$("#pv")!.addEventListener("click", () => go(idx - 1));
$("#nx")!.addEventListener("click", () => go(idx + 1));

let downX = 0;
stage.addEventListener("pointerdown", (e) => (downX = e.clientX));
stage.addEventListener("pointerup", (e) => {
  const d = e.clientX - downX;
  if (Math.abs(d) > 70) go(idx + (d < 0 ? 1 : -1));
});

mx.addEventListener("click", close);
modal.addEventListener("click", (e) => e.target === modal && close());

addEventListener("keydown", (e) => {
  const isOpen = modal.classList.contains("on");
  if (e.key === "Escape") close();
  if (e.key === "Tab" && isOpen) {
    // Keep focus inside the dialog: the close button plus every link in the story.
    const f: HTMLElement[] = [mx, ...$$("a", mc)];
    const k = f.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  }
  if (!isOpen && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName ?? "")) return;
    const r = sec.getBoundingClientRect();
    if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) go(idx + (e.key === "ArrowRight" ? 1 : -1));
  }
});

addEventListener("resize", lay, { passive: true });
lay();

// Calmer background while Projects is centred on screen (dims the constellation, halves the polyhedra).
new IntersectionObserver((es) => es.forEach((e) => document.body.classList.toggle("pj", e.isIntersecting)), {
  rootMargin: "-30% 0px -30% 0px",
}).observe(sec);
