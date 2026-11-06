// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import remarkGfm from "remark-gfm";

// https://astro.build/config
/**
 * @tailwindcss/vite 4.3.x returns its plugin typed against its own bundled
 * Vite `Plugin<any>[]`, which no longer matches Astro 6.4.8 `PluginOption`.
 * Cast at the call site until the typings realign.
 */
const tailwindPlugin = /** @type {any} */ (tailwindcss());

/**
 * @typedef {object} HastNode
 * @property {string} type
 * @property {string} [tagName]
 * @property {Record<string, unknown>} [properties]
 * @property {HastNode[]} [children]
 */

/**
 * Wraps every markdown table in its own scroll container so a narrow
 * viewport scrolls the table instead of the whole document.
 *
 * @returns {(tree: HastNode) => void}
 */
function rehypeTableScroll() {
  return (tree) => {
    /**
     * @param {HastNode} node
     */
    const wrapTables = (node) => {
      const children = node.children;
      if (!Array.isArray(children)) return;

      node.children = children.map((child) => {
        // A table is wrapped once and never visited again.
        if (child.type === "element" && child.tagName === "table") {
          return {
            type: "element",
            tagName: "div",
            properties: { className: ["prose-table-scroll"] },
            children: [child],
          };
        }

        wrapTables(child);
        return child;
      });
    };

    wrapTables(tree);
  };
}

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
    mdx({
      // GFM gives the MDX body the tables authored in the project files.
      remarkPlugins: [remarkGfm],
      // Tables get their own scroll container on narrow viewports.
      rehypePlugins: [rehypeTableScroll],
      // The shiki theme paints the block with a dark surface and an inline
      // style that no stylesheet can beat; the article owns the code surface.
      syntaxHighlight: false,
    }),
    sitemap({
      changefreq: "monthly",
      priority: 0.7,
      lastmod: new Date(),
    }),
    icon(),
  ],
});
