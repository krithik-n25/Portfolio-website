// Usage: node tools/diff.mjs <baselineDir> <newDir> <outDir>
// Pixel-diffs every PNG present in both trees (e.g. baseline/static vs compare/static).
// A pixel counts as different when any channel differs by more than THRESH.
// Writes a red-highlight diff image per file and prints the share of differing pixels.
import sharp from "sharp";
import { readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const [, , a, b, out = "compare/diff"] = process.argv;
const THRESH = 24;

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const rows = [];
for (const fa of walk(a).filter((f) => f.endsWith(".png"))) {
  const rel = relative(a, fa);
  const fb = join(b, rel);
  if (!existsSync(fb)) {
    rows.push([rel, "missing"]);
    continue;
  }
  const A = await sharp(fa).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(fb).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = Math.min(A.info.width, B.info.width);
  const h = Math.min(A.info.height, B.info.height);
  const diff = Buffer.alloc(w * h * 4);
  let n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ia = (y * A.info.width + x) * 4;
      const ib = (y * B.info.width + x) * 4;
      const o = (y * w + x) * 4;
      const d = Math.max(Math.abs(A.data[ia] - B.data[ib]), Math.abs(A.data[ia + 1] - B.data[ib + 1]), Math.abs(A.data[ia + 2] - B.data[ib + 2]));
      const g = A.data[ia] * 0.25;
      if (d > THRESH) {
        n++;
        diff.set([255, 0, 0, 255], o);
      } else diff.set([g, g, g, 255], o);
    }
  const pct = (100 * n) / (w * h);
  const size = A.info.height === B.info.height ? "" : ` height ${A.info.height}→${B.info.height}`;
  rows.push([rel, pct.toFixed(3) + "%" + size]);
  if (n) {
    const of = join(out, rel);
    mkdirSync(dirname(of), { recursive: true });
    await sharp(diff, { raw: { width: w, height: h, channels: 4 } }).png().toFile(of);
  }
}
for (const [f, r] of rows) console.log(r.padStart(22), f);
