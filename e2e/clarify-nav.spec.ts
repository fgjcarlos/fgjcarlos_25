import { expect, test, type Page } from "@playwright/test";

const HOME = "/";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** El orden de la casa: del proyecto más reciente al más antiguo. */
const PANELS = [
  { title: "LGB — Logix Gateway Bridge", year: "2026" },
  { title: "NRCC — Node-RED 5 Control Center", year: "2026" },
  { title: "ESP32-IIoT-Kit", year: "2025" },
  { title: "MCM — Mosquitto Control Manager", year: "2025" },
];

/** Las tres áreas de trabajo, tal cual están en `src/config/focusAreas.ts`. */
const FOCUS_AREAS = [
  "Software industrial",
  "Integración IT/OT",
  "IoT, visión y edge",
];

/**
 * Opens the home page in a deterministic state: reduced motion settles the
 * entry animations and the web font is ready before any text is measured.
 */
async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

/** Posición vertical de un elemento respecto al viewport. */
async function topOf(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .evaluate((element) => Math.round(element.getBoundingClientRect().top));
}

test.describe("Home: panel Sobre mí", () => {
  test("lands the nav Sobre mí on the about panel, with the bio and the three focus areas", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openHome(page);

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Sobre mí" })
      .click();

    await expect
      .poll(() => topOf(page, "#sobre-mi"), {
        message: "el panel «Sobre mí» debe quedar en el borde superior",
      })
      .toBe(0);

    const panel = page.locator("#sobre-mi");

    // Un encabezado visible: el panel se nombra, no se adivina.
    await expect(
      panel.getByRole("heading", { level: 2, name: "Sobre mí" }),
    ).toBeVisible();

    // El posicionamiento viene de `profile.json`, palabra por palabra.
    await expect(panel).toContainText(
      "desarrollador software con base técnica en automatización industrial",
    );

    for (const area of FOCUS_AREAS) {
      await expect(
        panel.getByRole("heading", { name: area }),
        `área «${area}»`,
      ).toBeVisible();
    }

    // El panel no puede quedar tapado por la barra flotante.
    const nav = await page.locator("nav").boundingBox();
    const heading = await panel
      .getByRole("heading", { level: 2 })
      .boundingBox();

    expect(nav).not.toBeNull();
    expect(heading).not.toBeNull();
    expect(heading!.y).toBeGreaterThan(nav!.y + nav!.height);
  });

  test("keeps the home free of the featured label and shows the year of every panel", async ({
    page,
  }) => {
    await openHome(page);

    await expect(page.locator("body")).not.toContainText("destacado");

    const articles = page.locator("#proyectos article");
    await expect(articles).toHaveCount(PANELS.length);

    const rows = await articles.evaluateAll((elements) =>
      elements.map((element) => ({
        title: element.querySelector("h2")?.textContent?.trim() ?? "",
        year: element.querySelector("time")?.textContent?.trim() ?? "",
      })),
    );

    expect(rows.map((row) => row.title)).toEqual(
      PANELS.map((panel) => panel.title),
    );
    expect(rows.map((row) => row.year)).toEqual(
      PANELS.map((panel) => panel.year),
    );

    for (const row of rows) {
      expect(row.year, `año de ${row.title}`).toMatch(/^\d{4}$/);
    }
  });

  test("labels every project article with its own heading", async ({
    page,
  }) => {
    await openHome(page);

    const articles = page.locator("#proyectos article");
    const count = await articles.count();

    expect(count).toBe(PANELS.length);

    for (const panel of PANELS) {
      const article = articles.filter({
        has: page.getByText(panel.title, { exact: true }),
      });

      await expect(article, `artículo de ${panel.title}`).toHaveCount(1);

      const labelledBy = await article.getAttribute("aria-labelledby");
      expect(labelledBy, `aria-labelledby de ${panel.title}`).toBeTruthy();

      const heading = article.locator(`#${labelledBy}`);
      await expect(heading, `título de ${panel.title}`).toHaveCount(1);
      expect(await heading.evaluate((element) => element.tagName)).toBe("H2");

      await expect(
        article,
        `nombre accesible de ${panel.title}`,
      ).toHaveAccessibleName(panel.title);
    }
  });
});

test.describe("Project detail: back to the project panel", () => {
  test("lands the ← Proyectos link on the panel of the case you came from", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/projects/mcm");

    await page
      .locator("article")
      .getByRole("link", { name: /Proyectos/ })
      .click();

    await page.waitForURL(/#proyecto-mcm$/);

    await expect
      .poll(() => topOf(page, "#proyecto-mcm"), {
        message: "el panel del proyecto debe quedar en el borde superior",
      })
      .toBe(0);

    await expect(page.locator("#proyecto-mcm h2")).toHaveText(
      "MCM — Mosquitto Control Manager",
    );
  });
});

test.describe("Theme toggle state", () => {
  test("exposes the theme with aria-pressed before and after a click and across navigations", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openHome(page);

    const toggle = page.locator("[data-theme-toggle]");

    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAccessibleName(/modo oscuro/i);

    await toggle.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    // Navegación con el router: a un proyecto y de vuelta.
    const link = page.locator('#proyectos a[href^="/projects/"]').first();
    await link.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/projects\//);

    await expect(page.locator("[data-theme-toggle]")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "FGJCARLOS" })
      .click();
    await page.waitForURL(/\/$/);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("[data-theme-toggle]")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

test.describe("Mobile menu", () => {
  test.use({ viewport: MOBILE, isMobile: true });

  test("closes on Escape and returns the focus to the summary", async ({
    page,
  }) => {
    await page.goto(HOME);

    const summary = page.getByRole("button", {
      name: "Abrir menú de navegación",
    });
    const menu = page.locator("nav .dropdown-content");

    await summary.click();
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(menu).toBeHidden();
    await expect(summary).toBeFocused();
  });

  test("closes when clicking outside", async ({ page }) => {
    await page.goto(HOME);

    const menu = page.locator("nav .dropdown-content");

    await page
      .getByRole("button", { name: "Abrir menú de navegación" })
      .click();
    await expect(menu).toBeVisible();

    await page.mouse.click(8, 500);

    await expect(menu).toBeHidden();
    await expect(page.locator("nav details")).not.toHaveAttribute("open", "");
  });

  test("keeps closing after a client-side navigation", async ({ page }) => {
    await page.goto(HOME);

    const summary = page.getByRole("button", {
      name: "Abrir menú de navegación",
    });
    const menu = page.locator("nav .dropdown-content");

    await summary.click();
    await menu.getByRole("link", { name: "Proyectos" }).click();
    await page.waitForURL(/.*#proyectos$/);

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "FGJCARLOS" })
      .click();
    await page.waitForURL(/\/$/);

    await summary.click();
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });
});
