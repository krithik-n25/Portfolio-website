// Custom cursor ring. Not set up at all on touch devices (the CSS hides it there too).
// One rAF loop moves it with transform and stops when it has caught up with the pointer.
import { touch } from "./lib/env";

const ring = document.getElementById("ring");
if (ring && !touch) {
  const hover = ring.dataset.hover || "a,button";
  let rx = 0;
  let ry = 0;
  let tx = 0;
  let ty = 0;
  let running = false;

  const place = () => (ring.style.transform = `translate3d(${rx}px,${ry}px,0)`);
  const loop = () => {
    rx += (tx - rx) * 0.2;
    ry += (ty - ry) * 0.2;
    place();
    if (Math.abs(tx - rx) + Math.abs(ty - ry) > 0.1) requestAnimationFrame(loop);
    else running = false;
  };

  addEventListener(
    "pointermove",
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
      ring.classList.toggle("big", !!(e.target as Element).closest?.(hover));
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    },
    { passive: true },
  );
  place(); // the original parks the ring at the top-left corner until the pointer moves
}
