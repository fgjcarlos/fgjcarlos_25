import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const HOME = "/";
const PROJECT_DETAIL = "/projects/mcm";
const NOT_FOUND = "/pagina-que-no-existe";

const PROFILE_NAME = "Carlos Fontán";
const BRAND = "FGJCARLOS";

const viewports = [
  {
    label: "desktop 1440x1000",
    viewport: { width: 1440, height: 1000 },
    isMobile: false,
  },
  {
    label: "mobile 390x844",
    viewport: { width: 390, height: 844 },
    isMobile: true,
  },
];

/**
 * Opens the home page in a deterministic state: reduced motion settles the
 * entry animations, and the web font is ready before any colour is measured.
 */
async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

/**
 * Scans the home page for WCAG 2 AA text contrast violations and reports the
 * ones that fall on the nodes flagged by the accessibility review: the project
 * status labels, the muted "Ver detalle" link, the profile brand eyebrow and
 * the footer text.
 */
async function scanContrastViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const violations = results.violations.filter(
    (violation) => violation.id === "color-contrast",
  );

  const selectors = violations.flatMap((violation) =>
    violation.nodes.flatMap((node) =>
      node.target.filter(
        (target): target is string => typeof target === "string",
      ),
    ),
  );

  const affected = await page.evaluate((targets) => {
    const classify = (element: Element | null): string => {
      if (!element) return "";

      const text = (element.textContent ?? "").trim().toLowerCase();

      if (element.closest("footer")) return "footer text";
      if (
        element.closest(".badge") &&
        ["alpha", "beta", "stable"].includes(text)
      ) {
        return "project status label";
      }
      if (text.startsWith("ver detalle")) return "project detail link";
      if (text === "fgjcarlos" && element.closest("#sobre-mi")) {
        return "profile brand eyebrow";
      }

      return "";
    };

    const affected: { target: string; reason: string }[] = [];

    for (const target of targets) {
      let elements: Element[] = [];

      try {
        elements = Array.from(document.querySelectorAll(target));
      } catch {
        continue;
      }

      for (const element of elements) {
        const reason = classify(element);

        if (reason) {
          affected.push({ target, reason });
        }
      }
    }

    return affected;
  }, selectors);

  const summary = violations
    .flatMap((violation) =>
      violation.nodes.map(
        (node) =>
          `${node.target.join(" ")} — ${(node.failureSummary ?? "").replace(/\s+/g, " ")}`,
      ),
    )
    .join("\n");

  return { violations, affected, summary };
}

test.describe("Home: heading structure and contrast", () => {
  for (const { label, viewport, isMobile } of viewports) {
    test.describe(label, () => {
      test.use({ viewport, isMobile });

      test("renders a single H1 with the profile name and keeps the brand as a navigation link", async ({
        page,
      }) => {
        await openHome(page);

        const headings = page.locator("h1");
        await expect(headings).toHaveCount(1);
        await expect(headings).toHaveText(PROFILE_NAME);

        const brand = page
          .getByRole("navigation")
          .getByRole("link", { name: BRAND });

        await expect(brand).toBeVisible();
        await expect(brand).toHaveAttribute("href", "/");

        const brandHasHeading = await brand.evaluate(
          (element) => element.querySelector("h1, h2, h3, h4, h5, h6") !== null,
        );

        expect(brandHasHeading).toBe(false);
      });

      test("renders zero WCAG 2 AA text contrast violations on the previously affected nodes", async ({
        page,
      }) => {
        await openHome(page);

        const { violations, affected, summary } =
          await scanContrastViolations(page);

        expect(
          affected,
          `contrast violations on previously affected nodes:\n${summary}`,
        ).toEqual([]);
        expect(
          violations.length,
          `color-contrast violations on the home page:\n${summary}`,
        ).toBe(0);
      });
    });
  }
});

test.describe("Shared navigation and footer: preservation on other routes", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("keeps its own H1, nav links and brand on the project detail and 404 pages", async ({
    page,
  }) => {
    await page.goto(PROJECT_DETAIL);

    const projectHeadings = page.locator("h1");
    await expect(projectHeadings).toHaveCount(1);
    await expect(projectHeadings).toHaveText("MCM — Mosquitto Control Manager");

    const navigation = page.getByRole("navigation");
    await expect(navigation.getByRole("link", { name: BRAND })).toBeVisible();
    await expect(navigation.locator("> ul > li > a")).toHaveCount(3);

    const notFoundResponse = await page.goto(NOT_FOUND);

    expect(notFoundResponse?.status()).toBe(404);

    const notFoundHeadings = page.locator("h1");
    await expect(notFoundHeadings).toHaveCount(1);
    await expect(notFoundHeadings).toHaveText("404");

    const notFoundBrand = page
      .getByRole("navigation")
      .getByRole("link", { name: BRAND });

    await expect(notFoundBrand).toBeVisible();
    await expect(notFoundBrand).toHaveAttribute("href", "/");
  });
});
