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

    const hero = await page.locator("section#sobre-mi").boundingBox();
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

test("keeps the project demo button readable in the default dark theme", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/mcm");

  const demo = page.getByRole("link", { name: "Ver demo" });
  await expect(demo).toBeVisible();

  // axe leaves oklch() colours as "incomplete", so the ratio is computed here:
  // the canvas resolves any CSS colour to sRGB.
  const ratio = await demo.evaluate((element) => {
    const style = getComputedStyle(element);
    const ctx = document.createElement("canvas").getContext("2d")!;
    const luminance = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
        .slice(0, 3)
        .map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [hi, lo] = [
      luminance(style.color),
      luminance(style.backgroundColor),
    ].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
