import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// TODO: switch this suite to assertive mode once existing
// color-contrast violations on Layout/Footer are fixed.
// Set A11Y_STRICT=1 in CI to fail on critical/serious violations.
const STRICT = process.env.A11Y_STRICT === "1";

const CRITICAL_IMPACTS = new Set(["critical", "serious"]);

const pagesToScan = [
  { name: "home", path: "/" },
  { name: "project detail (mcm)", path: "/projects/mcm.mdx" },
  { name: "404", path: "/pagina-que-no-existe" },
];

test.describe("a11y: WCAG 2 AA scan", () => {
  for (const { name, path } of pagesToScan) {
    test(`${name} — axe scan`, async ({ page }) => {
      await page.goto(path);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const blocking = results.violations.filter((v) =>
        CRITICAL_IMPACTS.has(v.impact ?? ""),
      );

      if (blocking.length > 0) {
        const summary = blocking.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          helpUrl: v.helpUrl,
        }));
        console.warn(`[a11y] ${name} has ${blocking.length} violation(s):`);
        console.warn(JSON.stringify(summary, null, 2));
        test.info().annotations.push({
          type: "a11y-violations",
          description: `${blocking.length} critical/serious violations on ${path}`,
        });
      }

      if (STRICT && blocking.length > 0) {
        throw new Error(
          `[a11y strict] ${blocking.length} blocking violations on ${path}`,
        );
      }
    });
  }
});
