// Panel and button effects: cursor spotlight, 3D tilt + scroll parallax once a panel is
// "live", magnetic buttons, and the hero's pointer parallax.
import { $, $$, reduceMotion, touch } from "./lib/env";
import { onReveal } from "./reveal";

const panels = $$(".panel");
const opts = { passive: true } as const;

for (const p of panels) {
  p.addEventListener(
    "pointermove",
    (e) => {
      const r = p.getBoundingClientRect();
      p.style.setProperty("--px", e.clientX - r.left + "px");
      p.style.setProperty("--py", e.clientY - r.top + "px");
    },
    opts,
  );
}

if (!reduceMotion) {
  const live: HTMLElement[] = [];
  const parallax = () => {
    for (const p of live) {
      const r = p.getBoundingClientRect();
      const v = Math.max(-22, Math.min(22, (innerHeight / 2 - (r.top + r.height / 2)) * 0.035));
      p.style.setProperty("--ty", v.toFixed(1) + "px");
    }
  };
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        parallax();
        ticking = false;
      });
    },
    opts,
  );

  for (const p of panels) {
    // Becomes live after its reveal animation has had time to play.
    onReveal(p, () =>
      setTimeout(() => {
        p.classList.add("live");
        live.push(p);
      }, 1700),
    );
    if (touch) continue;
    p.addEventListener(
      "pointermove",
      (e) => {
        if (!p.classList.contains("live")) return;
        const r = p.getBoundingClientRect();
        p.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 6 + "deg");
        p.style.setProperty("--rx", -((e.clientY - r.top) / r.height - 0.5) * 5 + "deg");
      },
      opts,
    );
    p.addEventListener("pointerleave", () => {
      p.style.setProperty("--rx", "0deg");
      p.style.setProperty("--ry", "0deg");
    });
  }

  if (!touch) {
    // Magnetic buttons. (The carousel arrows are not magnetic in the original either.)
    for (const b of $$(".pill,.btns a,.mail,.logo")) {
      b.addEventListener(
        "pointermove",
        (e) => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
        },
        opts,
      );
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    }

    const hero = $("#home");
    if (hero)
      addEventListener(
        "pointermove",
        (e) => {
          hero.style.transform = `translate3d(${(e.clientX / innerWidth - 0.5) * -14}px,${(e.clientY / innerHeight - 0.5) * -10}px,0)`;
        },
        opts,
      );
  }
}
