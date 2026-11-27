# Krithik Naidu — Portfolio

Static Astro site. No UI framework; vanilla TypeScript for interactivity and Three.js (from npm) for the background.

## Run

```sh
npm install
npm run dev        # http://localhost:4321
```

Requires Node 22.12 or newer. (Astro 7 needs Node 22.23.4+, see "Upgrading" below.)

## Build

```sh
npm run build      # outputs dist/ (index.html, contact.html, sitemap)
npm run preview    # serve dist/ locally
```

## Deploy

**Vercel** (current host): push to `main`; Vercel builds with `astro build` and serves `dist/`. `vercel.json` sets long-lived immutable caching for the hashed files in `/_astro/`.

**GitHub Pages** (alternative): build, then publish `dist/` (for example with the `withastro/action` GitHub Action). Pages ignores `vercel.json`, so there are no custom cache headers there.

Before the first deploy, set the live domain in two places: `site` in `astro.config.mjs` and `url` in `src/data/site.ts` (canonical URL, Open Graph, sitemap, JSON-LD).

## Where things live

| What | Where |
|---|---|
| Copy, links, email | `src/data/*.ts` (email and social links only in `site.ts`) |
| Page structure | `src/pages/index.astro`, `src/pages/contact.astro`, `src/components/` |
| Styles | `src/styles/` (entry files `home.css`, `contact-page.css`; `loader.css` is inlined in `<head>`) |
| Behaviour | `src/scripts/` (`loader.ts`, `background.ts`, `carousel.ts`, …) |
| Fonts | `public/fonts/` (self-hosted Latin woff2) |
| Original site | `legacy/` (do not edit; visual source of truth) |

## Checks

```sh
npm run build
node tools/screenshots.mjs http://127.0.0.1:4320 compare /contact.html   # screenshots of a served dist/
node tools/diff.mjs baseline/static compare/static compare/diff          # pixel diff vs the legacy baseline
node tools/loader-timing.mjs http://127.0.0.1:4320/ 5                     # loader milestones
node tools/smoke.mjs http://127.0.0.1:4320                                # console errors, loader, modal
```

Serve `dist/` for these with, for example, `python -m http.server 4320 --directory dist`.

## Upgrading

The project pins Astro 6.4.8 because the local Node version (22.19) is below Astro 7's minimum. After upgrading Node to 22.23.4 or newer, run `npm i astro@latest`; nothing in the code is version specific.
