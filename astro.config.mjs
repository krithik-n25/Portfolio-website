// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // TODO: set to the live Vercel domain (keep in sync with src/data/site.ts).
  site: "https://krithik-naidu.vercel.app",
  output: "static",
  // Keep the legacy URLs: /index.html and /contact.html.
  build: { format: "file" },
  integrations: [sitemap()],
  vite: {
    build: {
      // The only chunk over Vite's 500 kB default is the Three.js background (~147 kB gzipped),
      // which is loaded on idle after the loader, never on the critical path.
      chunkSizeWarningLimit: 600,
    },
  },
});
