# Portfolio migration brief: plain HTML to Astro, plus a faster 0 to 99 loader

You are migrating my personal portfolio (Krithik Naidu, AI/ML engineer, Ahmedabad) from a single hand-patched HTML file to an Astro project. The design must stay visually identical. This is a rebuild of the plumbing, not a redesign.

Source folder: `Portfolio/` containing `index.html` (5,443 lines), `contact.html` (119 lines), `favicon.svg`, `assets/agentic-whiteboard/{hero.png, whiteboard.png, dashboard.jpg}`.

Work in phases. Finish and verify each phase before starting the next. Commit after every phase with a clear message.

---

## Phase 0: Baseline before touching anything

1. Copy the original `Portfolio/` into `legacy/` inside the new repo. Never edit it. It is the visual source of truth.
2. With Playwright, take full page and per section screenshots of the legacy site at 1440x900, 768x1024 and 390x844. Save to `baseline/`. Wait for the loader to finish before capturing.
3. Record the legacy Lighthouse mobile scores (Performance, LCP, CLS, TBT) so we can prove the improvement later.
4. Record how long the legacy loader takes from navigation start to the page being interactive. (From reading the code: minimum 3.3s ramp, waits for `window.load` which includes the Three.js CDN, plus a 350ms delay, plus a 1.25s exit transition. Roughly 5 seconds total. This is the thing to fix.)

---

## Phase 1: Understand the legacy file (do not skip)

`index.html` is not clean. Know these facts before you port:

- The `<body>` is nearly empty. `<main id="app"></main>` is filled by JavaScript starting around line 2423 using string concatenation (`S()` and `P()` helpers build sections and panels).
- All content lives in JS arrays inside the main script: `EDU` (line 2077), `SK` (2097), `CR` (2148), `AC` (2175), `EX` (2228), `RS` (2272), `AW` (2315), `ART` (2332), `PJ` (2337, the projects), plus `EMAIL`.
- Styles are in 8 stacked blocks: the main `<style>` (line 27), then `#v3`, `#v4`, `#v5`, `#v6`, `#v7`, `#v8`. Later blocks override earlier ones, sometimes with `!important`. Cascade order matters. When you merge them, keep the exact order.
- There are 6 `<script>` blocks plus a Three.js r128 CDN include (line 2052). Several later blocks patch earlier ones. There are two different `count()` functions (lines 2742 and 5227), and the later one wins. Figure out which behaviour actually runs and keep only that.
- Line 3719 has a leftover comment: PASTE THIS WHOLE BLOCK in your portfolio file... Delete it.
- Features to preserve: the Three.js animated background (terrain, shooting stars, floating objects), the custom cursor ring (`.ring`, hidden on touch devices via `@media(hover:none)`), the vignette, section reveal animations (`.rv`, IntersectionObserver), the section navigation using `data-s` and `data-n`, the animated metric counters (`.mets b`), the copy email to clipboard button, the project cards with images, and the contact page.
- Fonts: Cormorant Garamond (500, 600, 700, 500 italic, 600 italic) and Inter (300, 400, 500, 600).

Write a short `MIGRATION_NOTES.md` listing what you found and any behaviour you were unsure about. Ask me before deleting anything that looks like a feature but might be dead code.

---

## Phase 2: Project scaffold

- Astro (latest stable), TypeScript, static output (`output: 'static'`).
- No UI framework needed. Use plain `.astro` components and vanilla TS for interactivity. Do not add React.
- Do not add Tailwind. Port the existing CSS as is.
- Install `three` from npm (not the CDN) and import only what the background uses.
- Install `sharp` for image optimisation (Astro `<Image>` uses it).
- Target structure:

```
src/
  layouts/Base.astro          (head, meta, fonts, loader markup, nav, footer)
  pages/index.astro
  pages/contact.astro
  components/
    Loader.astro
    Nav.astro
    Hero.astro
    Section.astro             (replaces the S() helper)
    Panel.astro               (replaces the P() helper)
    ProjectCard.astro
    Footer.astro
    Background.astro          (canvas element, script loaded lazily)
  data/
    education.ts  skills.ts  certifications.ts  activities.ts
    experience.ts  research.ts  awards.ts  articles.ts  projects.ts
    site.ts                   (name, email, social links, tagline)
  scripts/
    loader.ts  background.ts  cursor.ts  reveal.ts  nav.ts  counters.ts  contact.ts
  styles/
    tokens.css  base.css  loader.css  hero.css  sections.css  projects.css  contact.css
public/
  favicon.svg
  fonts/                      (self-hosted woff2)
```

- Move each JS data array into its own typed file in `src/data/`. Content must be identical, word for word. Do not rewrite or improve my copy.
- Components must render real HTML at build time. After the build, `view-source` on the page must show all section text, not an empty `<main>`.
- Split the CSS into the files above, but preserve cascade order and resolve the v3 to v8 overrides by merging each override into the rule it overrides where that is safe, and keep an `!important` only if removing it changes the render. Verify with screenshots.

---

## Phase 3: The loader (0 to 99 counter), rebuilt for speed

What I want: when someone opens the site, a start screen shows a counter going from 0 to 99, then reveals the site. It must feel quick. Right now it feels slow because it is slow by design.

### Why the current one is slow
- The count is a fixed 3.3 second ramp no matter how fast the page really loads.
- It waits for `window.load`, which waits for the Three.js CDN script and every image.
- After reaching 100 it waits 350ms, then plays a 1.25s exit animation (with 0.35s delay) and keeps the overlay for 1.9s.
- It runs a 100-particle canvas with an O(n squared) line-drawing loop on the main thread while the page is also loading. That steals CPU from the real work.
- It always plays, even when navigating back from the contact page.

### Known bug to fix: the white seam line stays on screen after the loader exits
The loader has a thin glowing horizontal line (`#ld .seam`, the progress bar at 50% height, z-index 3). The exit rules (`#ld.out ...`) fade the logo (`.c`), the canvas and the corner text, and slide the two dark halves (`.t` and `.b`) off screen, but nothing hides `.seam`. So the line keeps floating across the hero until the whole overlay is removed about 1.9 seconds later, which looks like a glitch on top of the finished page.
Fix:
- On exit, the seam must disappear first: `#ld.out .seam { opacity: 0; transition: opacity .2s; }` (or let it split with the halves). It must be fully gone before the halves finish sliding away.
- Remove the whole `#ld` element from the DOM as soon as the exit transition ends (listen to `transitionend` with a 1s safety timeout), not on a fixed 1.9s timer.
- Also make sure no other fixed 1px full-width line survives: the `#wp` section wipe line is already hidden by `display:none !important` in the v4 block, so delete the `#wp` element and its CSS entirely instead of hiding it.
- Verify with a screenshot taken 300ms after the exit starts and another at 1.5s. No horizontal line may appear in either.

### New behaviour
1. **Counter:** two digits, 00 to 99. Drop the percent sign (the legacy style already hides it). Keep the current look: dark `#0d0d0d` split panels, the KN monogram with rotating rings, the status text under the number, the seam line that scales with progress.
2. **Real progress, not fake time.** Progress is the combined state of things that actually matter for first paint: fonts ready (`document.fonts.ready`), the hero critical assets decoded, and DOM ready. Do NOT wait for `window.load`, images below the fold, or Three.js.
3. **Time budget:**
   - Fast connection: total loader time about 1.2 to 1.6 seconds from start to the site being visible.
   - Minimum visible time 0.9s so it never flashes.
   - Hard cap 2.5s. If assets are slow, finish anyway. Never block on the network for longer than that.
   - The number eases with requestAnimationFrame, targeting 99 when ready, and holds at 99 only until ready is true.
4. **Exit animation:** shorten from about 1.6s to about 0.7s total. Keep the split reveal but remove the extra delays. The site underneath must be interactive the moment the exit starts, not when it ends. Remove the overlay from the DOM when finished (`display:none` is not enough, remove it so it stops costing paint).
5. **Show once per session.** Use `sessionStorage` (wrapped in try/catch). If the user comes back from the contact page, or reloads within the same session, skip the loader entirely and go straight to the page. Optionally add a short fade instead.
6. **Make it paint instantly.** The loader markup and its critical CSS must be inline in the `<head>` (Astro does this when you use `<style is:inline>` or inline the small critical block) so it appears before any external CSS or JS arrives. No flash of unstyled content.
7. **Make it cheap.** Replace the 100-particle O(n squared) canvas with something much lighter: either 30 to 40 particles with no connecting lines, or a pure CSS effect. Pause all loader animation the instant it finishes. If `prefers-reduced-motion: reduce`, skip the particles, show just the number, and cut the exit to a simple fade.
8. **No-JS and error safety.** If JavaScript fails or is disabled, the loader must not trap the user. Add a `<noscript><style>#ld{display:none}</style></noscript>` and a CSS animation fallback that hides the overlay after 3s on its own.
9. **Accessibility.** `role="status"` and `aria-live="polite"` on the status text, and set the number to `aria-hidden` so screen readers are not spammed with 99 updates. Return focus to the top of the page when finished. Lock scroll while loading (the legacy `body.ld` class does this) and always unlock it.
10. Change the status messages to match the shorter time. Four steps is plenty, for example: Mapping terrain, Waking the agents, Compiling research, Ready.

---

## Phase 4: Performance work (this is a requirement, not a nice to have)

Targets on mobile Lighthouse: Performance 90+, LCP under 2.0s, CLS under 0.05, total JS well under the legacy size.

1. **Three.js background loads after first paint.** Initialise it with a dynamic `import('./background.ts')` inside `requestIdleCallback` (with a `setTimeout` fallback), triggered once the loader finishes. The hero must look finished without it, so the canvas fades in when ready. Tree-shake: import named modules from `three`, not the whole library.
2. **Make the 3D cheap.** Cap `devicePixelRatio` at 2 on desktop and 1.5 on mobile. Pause the render loop when the tab is hidden (`visibilitychange`) and when the canvas is off screen. Reduce object and particle counts on low-end devices (`navigator.hardwareConcurrency <= 4` or small screens). Respect `prefers-reduced-motion`. Dispose geometries and materials on cleanup.
3. **Fonts:** self-host Cormorant Garamond and Inter as subsetted woff2 in `public/fonts/`, only the weights listed above, Latin subset only. Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the two or three used above the fold. Use `font-display: swap`. Remove the Google Fonts links and preconnects. Use `size-adjust` fallback metrics to avoid layout shift.
4. **Images:** convert `hero.png` (199 KB), `whiteboard.png` (364 KB) and `dashboard.jpg` (511 KB) to AVIF and WebP through Astro `<Image>`/`<Picture>` with correct `width`, `height` and `sizes`. Below the fold images get `loading="lazy"` and `decoding="async"`. Only one image at most is eager, and only if it is the LCP element. Target total image weight under 250 KB.
5. **No render blocking:** all scripts are modules (deferred by default). CSS is bundled and minified by Astro. Inline only the critical loader and hero CSS.
6. **Event and animation hygiene:** one shared `IntersectionObserver` for reveals instead of one per element. Cursor ring movement uses `transform` in a single rAF loop with passive listeners, and is not initialised at all on touch devices. Animate only `transform` and `opacity`.
7. **Caching and delivery:** set long-lived immutable cache headers for hashed assets (a `vercel.json` or `_headers` file depending on host).
8. Add `<meta name="description">`, Open Graph and Twitter tags (title, description, image), canonical URL, `theme-color`, and a `sitemap.xml` via `@astrojs/sitemap`. Add JSON-LD `Person` schema with my name, job title, location and links.

---

## Phase 5: Contact page

Port `contact.html` to `src/pages/contact.astro` with identical look and behaviour. Keep the mailto link and the copy email button. Pull the email from `src/data/site.ts` so it exists in exactly one place. Do not add a backend or form service unless I ask.

---

## Phase 6: Verification (do all of this, report results)

1. `astro build` passes with zero errors and zero warnings.
2. Re-take the same screenshots as Phase 0 against the new build and diff them against `baseline/`. List any visual differences. Differences must be zero or explained and approved by me.
3. Check in a real browser at all three viewports: loader runs and counts 00 to 99, exits cleanly, nav works, every section reveals, cursor ring works on desktop and is absent on touch, the 3D background appears after the loader, the contact page works, the loader is skipped on return from contact.
4. Throttle to Slow 4G and 4x CPU slowdown. Confirm the loader still finishes by the 2.5s cap.
5. Run Lighthouse mobile on the built site and report before and after numbers next to the Phase 0 numbers.
6. Confirm `view-source` shows real content (SEO check) and that link previews have title, description and image.
7. Check the browser console is clean (no errors, no warnings, no failed requests).
8. Confirm keyboard navigation and focus outlines still work, and that `prefers-reduced-motion` is respected.

---

## Rules

- Do not change copy, colours, spacing, typography or layout.
- Do not add dependencies beyond: `astro`, `three`, `sharp`, `@astrojs/sitemap` (and Playwright as a dev dependency for screenshots).
- No frameworks, no Tailwind, no animation libraries.
- Keep code readable: small files, clear names, comments only where the reason is not obvious.
- If something in the legacy code is ambiguous, ask me instead of guessing.
- Deployment: static build, ready for Vercel or GitHub Pages. Add a short `README.md` with run, build and deploy commands.
- At the end, give me a summary: what changed, loader timing before vs after, Lighthouse before vs after, and anything I should double check.
