import { expect, test } from "@playwright/test";

/**
 * S7: el skip link es el primer elemento enfocable de todas las páginas:
 * aparece al recibir el foco (por encima de la barra flotante) y lleva el
 * foco al contenido (<main>).
 */

const PAGES = [
  { name: "home", path: "/" },
  { name: "detalle de proyecto", path: "/projects/mcm" },
  { name: "404", path: "/pagina-que-no-existe" },
];

/** ¿El punto cae dentro del enlace pintado (no recortado)? */
async function hitsSkipLink(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const link = document.querySelector<HTMLElement>("[data-skip-link]");
    if (!link) return false;
    const box = link.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return false;
    const hit = document.elementFromPoint(
      box.x + box.width / 2,
      box.y + box.height / 2,
    );
    return hit !== null && (hit === link || link.contains(hit));
  });
}

test.describe("Skip link", () => {
  for (const { name, path } of PAGES) {
    test(`es el primer tabulador y salta al contenido en ${name}`, async ({
      page,
    }) => {
      await page.goto(path);

      await page.keyboard.press("Tab");

      const skip = page.getByRole("link", { name: "Saltar al contenido" });
      await expect(skip).toBeFocused();

      // Aparece al enfocarse: el punto central cae en el enlace.
      expect(await hitsSkipLink(page), "el skip link debe pintarse").toBe(true);

      // Está por encima de la barra flotante, no debajo.
      const nav = await page.locator("nav").boundingBox();
      const skipBox = await skip.boundingBox();
      expect(nav).not.toBeNull();
      expect(skipBox).not.toBeNull();
      expect(skipBox!.width).toBeGreaterThan(0);
      expect(skipBox!.height).toBeGreaterThan(0);
      expect(skipBox!.y).toBeLessThanOrEqual(nav!.y + nav!.height);

      // Al activarlo, el foco entra en el contenido.
      await page.keyboard.press("Enter");

      await expect(page.locator("main#main")).toBeFocused();

      const inView = await page.evaluate(() => {
        const main = document.getElementById("main");
        if (!main) return false;
        const box = main.getBoundingClientRect();
        return box.top < window.innerHeight && box.bottom > 0;
      });
      expect(inView, "el contenido debe quedar a la vista").toBe(true);
    });
  }

  test("permanece oculto hasta que recibe el foco", async ({ page }) => {
    await page.goto("/");

    expect(await hitsSkipLink(page), "sin foco no se pinta").toBe(false);

    await page.keyboard.press("Tab");
    expect(await hitsSkipLink(page), "con foco se pinta").toBe(true);
  });

  test("el destino existe y es el contenido principal", async ({ page }) => {
    await page.goto("/");

    const main = page.locator("main#main");
    await expect(main).toHaveCount(1);

    const label = await main.getAttribute("aria-label");
    const labelledBy = await main.getAttribute("aria-labelledby");
    expect(label ?? labelledBy).toBeTruthy();
  });
});
