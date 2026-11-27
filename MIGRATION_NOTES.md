# Migration notes (Phase 1)

What the legacy `index.html` (5,443 lines) and `contact.html` (119 lines) actually do, based on a full read of both files. Line numbers refer to `legacy/index.html`.

## 1. Corrections to the brief

| Brief says | Actually |
|---|---|
| 6 `<script>` blocks | 7 inline blocks + the Three.js CDN include: loader (1911), main (2053), v5 (4006), v7 (4469), v8 (4823), final projects rebuild (4977). The last one is the 6th inline patch block; the loader is separate. |
| Contact page keeps a "copy email button" | `contact.html` has **no** copy button. It has an embedded **Google Form iframe**, a mailto "Email me" button, LinkedIn and GitHub. The copy button lives in the **Contact section of the home page** (`#cp`, line 2628). |
| Contact page shares the Three.js background | It has its **own 2D canvas constellation** (`#bgc`): 100 particles (40 on screens under 900px), O(n²) line loop, cursor repulsion. No Three.js. |
| Projects are `PJ` (line 2337) | That 3-project `PJ` is **dead**. The final block (4977) defines a new 6-project `PJ`, throws away the old carousel (clones `#stage` without its handlers, hides `#pn`, replaces `#pv`/`#nx`) and builds a new one. The **final 6-project list is what renders**. |

## 2. What actually runs (the patch chain resolved)

### Projects (the biggest mess)
1. Main script builds a 3-card carousel from the old `PJ` + `ART`.
2. v7 (4469) appends two `.sd` cards (Solar, CortexNews) with one wording.
3. v8 (4823) **removes** the `.sd` cards and adds two `.px` cards in a `.sdw` wrapper with slightly different wording.
4. Final block (4977) **removes** `.sd` and `.sdw`, replaces the stage, and renders **6 cards in a single carousel** in this order: Solar, Margdarshak, **VoltSync (front, idx 2)**, DAU Campus Agent, CortexNews, Agentic Whiteboard. The counter is a new `#pn5` element; the original `#pn` is set to `display:none`.

Result: the v7 `.sd` and v8 `.px/.sdw` cards never appear. Their data, CSS and JS are dead. The final block's wording is the copy that ships (e.g. Solar lead "An AI-powered platform that predicts solar energy generation…", CortexNews heading "Features").

### `count()` (2742 vs 5227)
- The main script's `count` (2742) respects `prefers-reduced-motion` (shows the final value instantly).
- The final block's `count` (5227) is the one that runs, because only the final carousel's `openP` is reachable. It **does not** check reduced motion, so counters always animate.
- Plan: keep the later behaviour (1.1s ease-out-cubic count, same regex) and add the reduced-motion guard back, because Phase 6.8 requires reduced motion to be respected. **Please confirm.**

### Modal
- One shared `#modal` / `#mc` / `#mx`. Focus trap, Escape and backdrop-click close come from the main script and still work with the final content.
- The final `openP` renders: badge, title (inline style `font-size:clamp(2rem,4.6vw,3.4rem)`), tagline, optional role line, lead, optional screenshots (Agentic Whiteboard only), "Highlights" or "Features" heading (Highlights when the project has `met` or `facts`), Key facts, Results + note, Tech stack chips, GitHub link, and a "Live demo" link only if `demo` is an http(s) URL.
- The final `openP` does **not** store `lastF`, so closing the modal does not return focus to the card (the old `closeP` refocuses `lastF`, which is null or stale). Small accessibility bug; I'll restore focus to the opening card.
- The Agentic Whiteboard `demo` value is the placeholder `"PASTE_MY_VERCEL_URL_HERE"`, so the Live demo button is hidden.

### Magnetic buttons
v5 makes `.pill, .btns a, .send, .nav2 button, .mail, .logo` follow the cursor. The final block then replaces the `.nav2` prev/next buttons with `cloneNode(true)` copies, which drops their listeners. So in the shipped site the carousel arrows are **not** magnetic. I'll keep that (parity) and apply the effect only to `.pill, .btns a, .mail, .logo`.

### Arrow-key carousel navigation
Two keydown handlers run. The main script's one drives the detached old cards (no visible effect). The final block's one is the real one. Keep only the final one.

### Things that depend on the Three.js render loop (important for lazy loading)
Inside the Three.js `frame()` loop (3552) the legacy code **also** does work that has nothing to do with 3D:
- moves the cursor ring (`ring.style.left/top`)
- updates the active section: `.dots button.on`, `#menu a[aria-current]`, the `#cnt` text ("05 / 10 · Credentials")
- updates the top scroll progress bar `#prog`

If WebGL fails (`new THREE.WebGLRenderer` throws → `return`), **none** of these work in legacy. Because the brief has Three.js load after the loader, these move to `cursor.ts` and `nav.ts` with their own loops/listeners and stop depending on the background.

### v7 Three.js monkey-patch (4608)
Overrides `THREE.Object3D.prototype.updateMatrixWorld` and, on every frame, finds the scene's 11 groups by index to (a) shift the Credentials torus knot (`G[5]`) into the free space right of the panel on screens ≥900px and (b) hide every other floating polyhedron (`G[8]`) while the Projects section is on screen (`body.pj`). I'll fold both directly into `background.ts`, with no prototype patching.

### `body.pj` + `#dim7` (v7)
While Projects is centred on screen, a fixed 50% `#222` overlay fades in and the constellation canvas drops to 35% opacity. Keep.

### Loader (1911)
As the brief describes, plus: the number uses three digits (`000`–`100`); the `%` is hidden by v6; the 5th message "Aligning the gears" is dropped by the new 4-step list. Hard fallback is 7s. `body.ld` pauses the hero's h1/sub/pill entrance animations until the loader exits; the new loader must keep this so the hero still animates in.

### Section wipe `#wp` (v5)
A MutationObserver on `#cnt` replays a 1px full-width wipe on each section change, but v6 sets `#wp{display:none!important}`. Dead. To be deleted (element, CSS, keyframes, observer), as the brief asks.

## 3. Features to preserve (confirmed present)

- Three.js background: stars (1,900, shader twinkle), dust (260), 3,200 motes, 3 shooting stars, shader terrain (wireframe + points) with sun glow, and one object per section that cross-fades with scroll: hero orbit halos + icosahedron, about brain + gears, education armillary, skills neural net with pulses, credentials torus knots, experience gears, research DNA helix, projects floating polyhedra, awards medal, contact particle blob. Mouse parallax and scroll velocity drive gear speed.
- **Second canvas `#cn5`** (v5): a full-screen 2D constellation **above** the Three.js canvas (84 particles, 36 on small screens), with cursor link lines, repulsion and a click shockwave. O(n²) per frame. Not in the brief's list, but visible.
- **Ambient sound button** (`.snd`, bottom left, "Click to enable sound"): Web Audio drone with 4 oscillators. Not in the brief's list, but visible.
- Cursor ring (`.ring`, grows over links/buttons/cards), hidden on `(hover:none)`. Note the contact page's ring moves via `left/top`, not `transform`.
- Vignette `.vig`, top scroll progress bar `.prog` (2px; this is intentional, not a leftover line), section dots rail, section counter `#cnt`, burger menu with numbered links.
- Reveals: `.rv` → `.in` (main IO, threshold .06, stagger `(i%3)*0.08s`), staggered children via `--i`, `.ttl` underline grow, per-letter title split (`.lt`, v5), panel shine sweep, panel spotlight following the cursor (`--px/--py`).
- v5 panel extras: sweeping conic "edge" light and 4 corner brackets on every `.panel`; after reveal + 1.7s a panel becomes `.live` (3D tilt on hover, scroll parallax `--ty`); magnetic buttons; hero parallax on pointer move; project card SVG tilt + float.
- Section numbering is pure CSS counters (`.ttl::before` "05 — Portfolio", `.eb::before` "10 — ").
- Copy email button (`#cp`): writes to clipboard and shows "Copied ✓" for 1.8s. If `writeText` throws synchronously it falls back to `mailto:`. (It does not handle a rejected promise; I'll keep the behaviour but catch the rejection too.)
- Contact page: Google Form iframe with "Loading form…" and a 6s "Still loading…" message, rotating conic edge on the panel, corner brackets, magnetic buttons, `LET'S TALK` clip reveal.

## 4. Dead code found (to delete; awaiting your OK where marked)

| Item | Where | Status |
|---|---|---|
| `PASTE THIS WHOLE BLOCK…` comment | 3718–3720 | Delete (brief says so) |
| `#wp` wipe element, CSS, `wipe5` keyframes, MutationObserver | v5, v6 | Delete (brief says so) |
| Old 3-project `PJ`, `ART`, old carousel, old `openP/closeP` render, old `count`, old arrow-key handler, `#pn` | main script | Overwritten at runtime by the final block. Delete, keep final behaviour. **Ask** |
| v7 `.sd` side cards (data, CSS, JS) and v8 `.sdw/.px` side cards (data, CSS, JS, `place()`) | v7, v8 | Created then removed on every load; never visible. Delete. **Ask** |
| `soc` social-icon HTML string (GitHub/Email/LinkedIn SVGs) | 2447 | Built but never inserted. Delete. **Ask** |
| `xp()` helper | 2458 | Never called. Delete |
| Contact-form CSS: `.contact`, `form`, `.f`, `.row2`, `.soc`, `.send`, `.st`, `.f input:focus` (v3) | main style, v3 | No matching markup on either page. Delete. **Ask** |
| `#ld .n small` (the `%`) | v3/v6 | Hidden by v6; brief drops it. Delete |
| `.gs` / `.cta` padding rules | main, v4 | Used, keep |
| Duplicate `--tx` set in v5 card tilt; v5 card-tilt handler | v5 4100 | v5 binds to the old `.pc` cards, which the final block replaces, so it is dead; the final block has its own tilt. Delete |
| `body.lock` | main | Used by the modal, keep |
| Hero `.meta` "Ahmedabad, India / B.E. Computer Science" | hero | Used, keep |

## 5. Other observations

- Fonts: the home page requests Cormorant 500, 600, 700, 500 italic but uses italic **600** for `.big em` and `.mail`, so the browser synthesises it (or substitutes 500 italic). The contact page does load 600 italic. Self-hosting 600 italic (as the brief lists) makes those two elements render the real face: a tiny glyph-shape difference vs. the baseline, which I'll call out in the diff.
- `.big` font-size is set three times (v4 then v6 wins: `clamp(2.2rem,7vw,6rem)`). `#ld .n` size is set in v3 and overridden in v6. These are the kind of overrides I'll merge.
- The legacy `<meta name="theme-color">` is `#222222`; the loader panels are `#0d0d0d`.
- `--l1` is `rgba(20,18,18,0)` (fully transparent) on the home page but `rgba(255,255,255,.16)` on the contact page. So many "borders" using `--l1` on the home page are invisible. Keep as is on both pages (visual parity), each page getting its own value.
- Image paths `assets/agentic-whiteboard/*` exist and load. They are only requested when the Agentic Whiteboard modal opens, so none of them are in the LCP path. The hero LCP is text (the loader number while the loader is up).
- Three.js npm (current) vs r128: since r152 the renderer converts output to sRGB and enables colour management, which would brighten the grey motes and alter alpha blending. To stay visually identical I'll set `ColorManagement.enabled = false` and `outputColorSpace = LinearSRGBColorSpace`. WebGL1 is no longer supported by current three (WebGL2 only); the legacy shaders (`attribute`/`varying`/`gl_FragColor`) still compile because three injects the compatibility defines.

## 6. Questions asked before Phase 2

1. OK to delete the dead items marked **Ask** in section 4?
2. Keep the `#cn5` constellation canvas and the ambient sound button? (Both visible, neither in the brief's list. My plan: keep both, start `#cn5` after the loader with the Three.js idle init and make its line loop cheaper with a spatial grid so it looks the same.)
3. Reduced-motion counters: OK to add the guard back (see `count()` above)?
4. Contact page: there is no copy-email button there today. Keep it that way (my recommendation; adding one changes the design), or add one?
5. Site URL for canonical, Open Graph and sitemap? And host: Vercel or GitHub Pages?
6. Agentic Whiteboard live demo URL, or keep it hidden?

### Answers (2026-11-27)

1. Dead code: delete it all. Done.
2. Constellation `#cn5` and sound button: keep both, optimised. The constellation now starts after the loader, finds neighbours with a spatial grid and batches its link lines into 16 alpha buckets (at most 16 strokes per frame). The AudioContext is still created only on click.
3. Contact page: keep as is (no copy button). Email and links come from `src/data/site.ts`.
4. Host: Vercel (already live). The live domain is still needed for `site` in `astro.config.mjs` and `url` in `src/data/site.ts`; the placeholder is `https://krithik-naidu.vercel.app`.

Defaults I applied without asking (say if you want them changed):
- Reduced-motion counters: the guard is back (counters show the final value instantly).
- Agentic Whiteboard live demo: still hidden until `demo` in `src/data/projects.ts` is a real URL.
- Closing the project modal returns focus to the card that opened it (the shipped legacy code lost this).
- The copy button also falls back to `mailto:` when the clipboard promise rejects, not only when it throws.

## 7. Decisions made during the port

- **Astro 6.4.8, not 7.x.** Astro 7 requires Node 22.23.4+; this machine has 22.19.0. The code uses nothing version specific; upgrade Node, then `npm i astro@latest`. Note `npm audit` reports advisories against Astro 6 (mostly SSR/island/adapter issues that do not apply to a static build); upgrading to 7 clears them.
- **`sharp` override.** Astro bundled its own older sharp (0.34.5, flagged by `npm audit`); `overrides` in `package.json` makes it use the top-level 0.35.5.
- **Italic 600 on the home page is synthesised on purpose.** The legacy home page never loaded a 600 italic face, so Chrome faked it from 500 italic for "INTELLIGENT" and the email button. To stay identical, the home page declares the italic face at weight 500 only. The contact page did load real 600 italic and still does.
- **₹ glyph.** Legacy pulled an 85 KB Inter latin-ext file just for "₹25,000". It is now a 1.2 KB single-glyph subset.
- **Loader state lives on `<html>`** (`html.ld`, `html.noload`) instead of `body.ld`, because it has to be set by a tiny inline script in `<head>` before the body exists.
- **The home stylesheet loads without blocking render** (`preload` + `onload`, `<noscript>` fallback) so the inline loader paints first. The loader waits for that stylesheet before revealing the page. On a repeat visit in the same session a plain `#222` cover fades out as soon as the (cached) stylesheet is in. The contact page has no loader, so its 8 KB stylesheet stays render-blocking.
- **The 3D canvas fades in** (`opacity` 0 → 1 over 0.8s) once the first frame renders. The body is the same `#222` underneath, so the hero looks finished without it.
- **Cursor ring** moves with `transform` in its own rAF loop that stops when the ring has caught up, instead of `left/top` inside the Three.js loop.
- **Panel `!important`s removed** except two: `.lst p` (kept as written; harmless) and `transition-delay` on `.panel.live` (it has to beat the inline reveal stagger). The edge/corner `!important`s were only fighting the reveal rule; the reveal selector now excludes them with `:not(.ttl, .edge, .cn)`, same specificity.
- **"Pause when the canvas is off screen":** the canvas is `position: fixed` and full-viewport, so it is never off screen. Instead the loop pauses when the tab is hidden and while a project modal (96% opaque) covers it.
- **`articles.ts` not created.** `ART` in the legacy file held the card SVG artwork, not articles; each SVG now lives with its project in `projects.ts`.
- **URLs unchanged:** `build.format: "file"` emits `index.html` and `contact.html`.
