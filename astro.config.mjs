// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
/**
 * astro-icon 1.2.0 returns its integration typed against its own bundled
 * Vite `Plugin<any>[]`, which no longer matches Astro 6.4.8 `PluginOption`.
 * Cast at the call site until astro-icon ships updated typings.
 * @type {import('astro').AstroIntegration}
 */
const iconIntegration = /** @type {any} */ (icon());

export default defineConfig({
  site: 'https://fgjcarlos.com',

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    mdx(),
    sitemap({
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    iconIntegration,
  ],
});
