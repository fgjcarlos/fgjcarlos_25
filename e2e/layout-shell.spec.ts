import { expect, test } from "@playwright/test";

/**
 * El shell es a sangre: la barra de navegación ocupa todo el ancho del
 * viewport y el contenido mantiene su columna legible dentro de él.
 */
const VIEWPORT = { width: 1440, height: 900 };

/** Ancho del viewport de layout (sin la barra de scroll del navegador). */
async function layoutWidth(
  page: import("@playwright/test").Page,
): Promise<number> {
  return page.evaluate(() => document.documentElement.clientWidth);
}

test.describe("Full-width shell", () => {
  test.use({ viewport: VIEWPORT });

  test("spans the nav across the viewport on home and project detail", async ({
    page,
  }) => {
    for (const path of ["/", "/projects/mcm"]) {
      await page.goto(path);

      const width = await layoutWidth(page);

      const brand = await page.locator("nav .cine-pill-brand").boundingBox();
      const toggle = await page.locator("[data-theme-toggle]").boundingBox();

      expect(brand, `brand pill on ${path}`).not.toBeNull();
      expect(toggle, `theme toggle on ${path}`).not.toBeNull();

      expect(brand!.x, `brand pill left edge on ${path}`).toBeLessThanOrEqual(
        40,
      );
      expect(
        width - (toggle!.x + toggle!.width),
        `theme toggle right edge on ${path}`,
      ).toBeLessThanOrEqual(40);
    }
  });

  test("starts the home hero at the top of the viewport under the floating nav", async ({
    page,
  }) => {
    await page.goto("/");

    const hero = await page.locator("section.cine-hero").boundingBox();
    const nav = await page.locator("nav").boundingBox();

    expect(hero, "hero panel").not.toBeNull();
    expect(nav, "nav").not.toBeNull();

    // El hero es la primera pantalla: empieza en y=0 y ocupa la ventana.
    expect(hero!.y).toBe(0);
    expect(hero!.height).toBe(VIEWPORT.height);

    // La barra flota sobre el hero en lugar de empujarlo hacia abajo.
    expect(nav!.y).toBeLessThan(hero!.y + hero!.height);
    expect(nav!.y + nav!.height).toBeGreaterThan(hero!.y);
  });

  test("runs the project detail full width with its content below the nav", async ({
    page,
  }) => {
    await page.goto("/projects/mcm");

    const width = await layoutWidth(page);

    const main = await page.locator("main").boundingBox();
    const nav = await page.locator("nav").boundingBox();
    const heading = await page.locator("article h1").boundingBox();

    expect(main, "main").not.toBeNull();
    expect(nav, "nav").not.toBeNull();
    expect(heading, "article heading").not.toBeNull();

    expect(main!.width).toBeCloseTo(width, 0);

    // El contenido nunca queda bajo la barra fija.
    expect(heading!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
  });

  test("spans the footer across the viewport", async ({ page }) => {
    await page.goto("/projects/mcm");

    const width = await layoutWidth(page);
    const footer = await page.locator("footer").boundingBox();

    expect(footer, "footer").not.toBeNull();
    expect(footer!.width).toBeCloseTo(width, 0);
  });
});

test("offers the repository but no demo button on a project page", async ({
  page,
}) => {
  await page.goto("/projects/mcm");

  await expect(page.getByRole("link", { name: "Repositorio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver demo" })).toHaveCount(0);
});
