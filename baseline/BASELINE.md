# Legacy baseline (Phase 0)

Captured 2026-11-27 against `legacy/` served locally (`python -m http.server`, no compression), Chrome stable, Playwright 1.65.1.

## Screenshots

- `baseline/live/<viewport>/`: as rendered, including the random Three.js and constellation canvases.
- `baseline/static/<viewport>/`: the same captures with the random background canvases hidden. Use this set for pixel diffs.
- Viewports: 1440x900, 768x1024 (touch), 390x844 (touch, mobile).
- Files: `full.png`, `section-<id>.png` for the 10 sections, `contact-full.png`.
- Tool: `node tools/screenshots.mjs <baseUrl> <outDir> [contactPath]`

## Loader timing (ms from navigation start, median)

Tool: `node tools/loader-timing.mjs <url> 5`, viewport 1440x900.

| Condition | Exit starts | Page interactive (`body.ld` removed) | Overlay gone |
|---|---|---|---|
| Unthrottled (5 runs) | 4076 | 4428 | 5979 |
| Slow 4G + 4x CPU (3 runs) | 7121 | 7497 | 9056 |

Raw output: `baseline/loader-timing.txt`.

## Lighthouse mobile (13.6.0, simulated throttling, 3 runs)

| Run | Perf | LCP | CLS | TBT | FCP | Speed Index | Bytes |
|---|---|---|---|---|---|---|---|
| 1 | 74 | 3.0 s | 0.009 | 570 ms | 3.0 s | 3.2 s | 476 KiB |
| 2 (median) | **56** | **3.0 s** | **0.013** | **2,190 ms** | 3.0 s | 5.6 s | 477 KiB |
| 3 | 53 | 3.1 s | 0.013 | 2,610 ms | 3.1 s | 6.5 s | 477 KiB |

Accessibility 98, Best practices 100, SEO 100 on all runs.

Resource breakdown (median run): document 164 KiB (uncompressed, includes ~110 KB of inline JS and ~54 KB of inline CSS), Three.js r128 from CDN 119 KiB transferred, fonts 192 KiB (4 Google Fonts files), images 0 (project screenshots only load inside the Agentic Whiteboard modal).

Raw reports: `baseline/lighthouse-legacy-{1,2,3}.json`.
