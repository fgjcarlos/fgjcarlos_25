// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
/**
 * @tailwindcss/vite 4.3.x returns its plugin typed against its own bundled
 * Vite `Plugin<any>[]`, which no longer matches Astro 6.4.8 `PluginOption`.
 * Cast at the call site until the typings realign.
 */
const tailwindPlugin = /** @type {any} */ (tailwindcss());

export default defineConfig({
  site: "https://fgjcarlos.com",

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },

  vite: {
    plugins: [tailwindPlugin],
  },

  integrations: [
    mdx(),
    sitemap({
      changefreq: "monthly",
      priority: 0.7,
      lastmod: new Date(),
    }),
    icon(),
  ],
});
