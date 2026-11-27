// Start-screen loader: counts 00 → 99 against real readiness (fonts + stylesheet + DOM),
// never waits for window.load, images or Three.js, and gives up waiting at a hard cap.
const MIN_VISIBLE = 900; // ms on screen, so it never just flashes
const HARD_CAP = 2500; // ms from navigation start
const SAFETY_REMOVE = 1000; // ms after exit starts, in case transitionend never fires
const STEPS: [number, string][] = [
  [0, "Mapping terrain"],
  [25, "Waking the agents"],
  [60, "Compiling research"],
  [99, "Ready"],
];

const root = document.documentElement;
const ld = document.getElementById("ld");

function stylesheetReady(): Promise<void> {
  const link = document.querySelector<HTMLLinkElement>("link[data-main-css]");
  if (!link || (link.rel === "stylesheet" && link.sheet)) return Promise.resolve();
  return new Promise((r) => {
    link.addEventListener("load", () => r(), { once: true });
    link.addEventListener("error", () => r(), { once: true });
  });
}

function fontsReady(): Promise<unknown> {
  if (!document.fonts) return Promise.resolve();
  // The faces visible on the first screen, then anything else already queued.
  return Promise.all([
    document.fonts.load('600 1em "Cormorant Garamond"'),
    document.fonts.load('500 1em "Inter"'),
  ])
    .then(() => document.fonts.ready)
    .catch(() => undefined);
}

function markSeen() {
  try {
    sessionStorage.setItem("kn-ld", "1");
  } catch {
    /* storage blocked: the loader just plays again next time */
  }
}

/** Hand the page back: unlock scroll, start the hero, tell the rest of the app. */
function release() {
  root.classList.remove("ld");
  markSeen();
  dispatchEvent(new Event("loader:done"));
}

function removeWhenDone(el: HTMLElement, isEnd: (e: TransitionEvent) => boolean) {
  let gone = false;
  const remove = () => {
    if (gone) return;
    gone = true;
    el.remove();
    document.getElementById("home")?.focus({ preventScroll: true });
  };
  el.addEventListener("transitionend", (e) => isEnd(e) && remove());
  setTimeout(remove, SAFETY_REMOVE);
}

function runRepeatVisit(el: HTMLElement) {
  // Same session: no counter, just a short fade once the stylesheet is in (or at the cap).
  const cap = new Promise((r) => setTimeout(r, Math.max(0, HARD_CAP - performance.now())));
  Promise.race([stylesheetReady(), cap]).then(() => {
    el.classList.add("out");
    release();
    removeWhenDone(el, (e) => e.target === el && e.propertyName === "opacity");
  });
}

function runCounter(el: HTMLElement) {
  const num = el.querySelector<HTMLElement>(".n")!;
  const status = el.querySelector<HTMLElement>(".s")!;
  const seam = el.querySelector<HTMLElement>(".seam")!;
  const bottom = el.querySelector<HTMLElement>(".b")!;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stopParticles = reduce ? () => {} : particles(el.querySelector("canvas"));

  const tasks = [stylesheetReady(), fontsReady()];
  let done = 1; // DOM is ready: this module runs after the document is parsed
  const total = tasks.length + 1;
  let ready = false;
  tasks.forEach((t) => t.then(() => done++));
  Promise.all(tasks).then(() => (ready = true));

  let shown = 0;
  let step = -1;
  let last = performance.now();
  let finished = false;

  const render = (v: number) => {
    const q = Math.min(99, Math.round(v));
    num.textContent = (q < 10 ? "0" : "") + q;
    seam.style.transform = `scaleX(${v / 99})`;
    let s = 0;
    for (let k = 0; k < STEPS.length; k++) if (q >= STEPS[k][0]) s = k;
    if (s !== step) {
      step = s;
      status.textContent = STEPS[s][1];
    }
  };

  const exit = () => {
    finished = true;
    render(99);
    stopParticles();
    el.classList.add("out", "done");
    release();
    removeWhenDone(el, (e) =>
      reduce ? e.target === el && e.propertyName === "opacity" : e.target === bottom && e.propertyName === "transform",
    );
  };

  const frame = (now: number) => {
    if (finished) return;
    const dt = now - last;
    last = now;
    if (now >= HARD_CAP) ready = true;
    // Aim for 99 once ready; before that, follow the finished tasks and creep with time.
    const goal = ready ? 99 : Math.min(88, Math.max((done / total) * 88, (now / HARD_CAP) * 88));
    const inc = Math.min((goal - shown) * (1 - Math.exp(-dt / 140)), dt * 0.16);
    shown = Math.min(99, shown + Math.max(0, inc));
    if (now >= HARD_CAP) shown = 99; // never block past the cap
    render(shown);
    if (ready && shown >= 98.5 && now >= MIN_VISIBLE) return exit();
    requestAnimationFrame(frame);
  };
  render(0);
  requestAnimationFrame(frame);
}

/** Light particle drift on the loader canvas: 36 dots, no connecting lines. Returns a stop function. */
function particles(cv: HTMLCanvasElement | null) {
  if (!cv) return () => {};
  const x = cv.getContext("2d")!;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const W = innerWidth;
  const H = innerHeight;
  cv.width = W * dpr;
  cv.height = H * dpr;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = "rgba(255,255,255,.75)";
  const P = Array.from({ length: 36 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));
  let raf = 0;
  const tick = () => {
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      x.fillRect(p.x, p.y, 1.4, 1.4);
    }
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => cancelAnimationFrame(raf);
}

if (ld) {
  if (performance.now() > HARD_CAP + 400) {
    // Arrived very late (the CSS safety net may already have hidden it): just get out of the way.
    ld.remove();
    release();
  } else {
    ld.style.animation = "none"; // cancel the CSS safety net, the script is in charge now
    if (root.classList.contains("noload")) runRepeatVisit(ld);
    else runCounter(ld);
  }
} else {
  release();
}
