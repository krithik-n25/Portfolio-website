// Interactive 2D constellation: drifting dots, faint links between near neighbours,
// lines to the cursor with repulsion, and (home page) a click shockwave.
//
// Same look as the original, cheaper to draw: neighbours are found through a spatial grid
// instead of testing every pair, and links are batched into 16 alpha buckets so each frame
// issues at most 16 strokes instead of one per line.

interface Options {
  canvas: HTMLCanvasElement;
  count: (w: number) => number;
  push: number; // cursor repulsion per frame
  cursorAlpha: number; // max alpha of cursor lines
  shockwave: boolean;
}

const LINK = 9000; // squared px: neighbour link distance (~95px)
const CURSOR = 22500; // squared px: cursor reach (150px)
const BUCKETS = 16;

export function constellation({ canvas, count, push, cursorAlpha, shockwave }: Options) {
  const x = canvas.getContext("2d")!;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const cell = Math.sqrt(LINK);
  let W = 0;
  let H = 0;
  let P: { x: number; y: number; vx: number; vy: number }[] = [];
  const m = { x: -999, y: -999 };
  let rings: { x: number; y: number; r: number }[] = [];
  const paths = Array.from({ length: BUCKETS }, () => new Path2D());

  function resize() {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    P = Array.from({ length: count(W) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
  }
  resize();
  addEventListener("resize", resize, { passive: true });
  addEventListener(
    "pointermove",
    (e) => {
      m.x = e.clientX;
      m.y = e.clientY;
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => (m.x = m.y = -999));
  if (shockwave)
    addEventListener(
      "pointerdown",
      (e) => {
        rings.push({ x: e.clientX, y: e.clientY, r: 0 });
        for (const p of P) {
          const dx = p.x - e.clientX;
          const dy = p.y - e.clientY;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < 260) {
            p.vx += (dx / d) * (260 - d) * 0.03;
            p.vy += (dy / d) * (260 - d) * 0.03;
          }
        }
      },
      { passive: true },
    );

  const grid = new Map<number, number[]>();
  const key = (cx: number, cy: number) => cx * 4096 + cy;

  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    x.clearRect(0, 0, W, H);
    x.lineWidth = 1;
    x.fillStyle = "rgba(255,255,255,.55)";
    for (const p of P) {
      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const d = dx * dx + dy * dy;
      if (d < CURSOR && d > 1) {
        const s = Math.sqrt(d);
        p.vx += (dx / s) * push;
        p.vy += (dy / s) * push;
        x.strokeStyle = `rgba(255,255,255,${cursorAlpha * (1 - s / 150)})`;
        x.beginPath();
        x.moveTo(p.x, p.y);
        x.lineTo(m.x, m.y);
        x.stroke();
      }
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      x.fillRect(p.x, p.y, 1.6, 1.6);
    }

    // Neighbour links via the grid: each pair is checked once (j > i).
    grid.clear();
    P.forEach((p, i) => {
      const k = key(Math.floor(p.x / cell) + 1, Math.floor(p.y / cell) + 1);
      const list = grid.get(k);
      if (list) list.push(i);
      else grid.set(k, [i]);
    });
    for (let b = 0; b < BUCKETS; b++) paths[b] = new Path2D();
    P.forEach((a, i) => {
      const cx = Math.floor(a.x / cell) + 1;
      const cy = Math.floor(a.y / cell) + 1;
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++) {
          const list = grid.get(key(cx + ox, cy + oy));
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const q = P[j];
            const ex = a.x - q.x;
            const ey = a.y - q.y;
            const e = ex * ex + ey * ey;
            if (e >= LINK) continue;
            const bucket = Math.min(BUCKETS - 1, Math.floor((1 - e / LINK) * BUCKETS));
            paths[bucket].moveTo(a.x, a.y);
            paths[bucket].lineTo(q.x, q.y);
          }
        }
    });
    for (let b = 0; b < BUCKETS; b++) {
      x.strokeStyle = `rgba(255,255,255,${(0.16 * (b + 0.5)) / BUCKETS})`;
      x.stroke(paths[b]);
    }

    if (rings.length) {
      x.lineWidth = 1.5;
      rings = rings.filter((r) => {
        r.r += 7;
        x.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.7 * (1 - r.r / 260))})`;
        x.beginPath();
        x.arc(r.x, r.y, r.r, 0, 6.2832);
        x.stroke();
        return r.r < 260;
      });
      x.lineWidth = 1;
    }
  }
  requestAnimationFrame(frame);
}

export function homeConstellation() {
  const canvas = document.getElementById("cn5") as HTMLCanvasElement | null;
  if (canvas) constellation({ canvas, count: (w) => (w < 900 ? 36 : 84), push: 0.04, cursorAlpha: 0.5, shockwave: true });
}

export function contactConstellation() {
  const canvas = document.getElementById("bgc") as HTMLCanvasElement | null;
  if (canvas) constellation({ canvas, count: (w) => (w < 900 ? 40 : 100), push: 0.03, cursorAlpha: 0.4, shockwave: false });
}
