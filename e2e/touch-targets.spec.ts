import { expect, test, type Page } from "@playwright/test";

/**
 * S7: los objetivos táctiles de la casa miden 44×44 CSS px como mínimo y
 * guardan 8px entre vecinos.
 */

const TOUCH = 44;
const GAP = 8;

async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

/** Alto y ancho del área pulsable de un elemento. */
async function hitArea(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
}

test.describe("Touch targets", () => {
  test("los enlaces secundarios del panel miden 44px de alto", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const links = page.locator("#proyectos article .cine-links a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index++) {
      const link = links.nth(index);
      await link.scrollIntoViewIfNeeded();

      const area = await hitArea(link);

      expect(
        area.height,
        `alto del enlace ${index} ("${(await link.textContent())?.trim()}")`,
      ).toBeGreaterThanOrEqual(TOUCH);
      expect(area.width).toBeGreaterThanOrEqual(TOUCH);
    }
  });

  test("hay 8px entre los enlaces vecinos de un panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const gaps = await page
      .locator("#proyectos article")
      .first()
      .evaluate((article) => {
        const links = Array.from(
          article.querySelectorAll<HTMLElement>(".cine-links a"),
        ).map((link) => link.getBoundingClientRect());

        const spaces: number[] = [];
        for (let index = 1; index < links.length; index++) {
          const previous = links[index - 1];
          const next = links[index];
          // Si comparten línea, el hueco es horizontal; si el grupo se parte
          // en dos filas, es vertical.
          const sameLine =
            previous.bottom > next.top && next.bottom > previous.top;
          spaces.push(
            sameLine ? next.left - previous.right : next.top - previous.bottom,
          );
        }
        return spaces;
      });

    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(gap).toBeGreaterThanOrEqual(GAP);
    }
  });

  test("las filas del menú móvil miden 44px y guardan 8px entre ellas", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page
      .getByRole("button", { name: "Abrir menú de navegación" })
      .click();

    const rows = page.locator("nav .dropdown-content a");
    await expect(rows).toHaveCount(3);

    const boxes: { top: number; bottom: number; height: number }[] = [];
    for (let index = 0; index < 3; index++) {
      const box = await rows.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height, `fila ${index}`).toBeGreaterThanOrEqual(TOUCH);
      boxes.push({
        top: box!.y,
        bottom: box!.y + box!.height,
        height: box!.height,
      });
    }

    for (let index = 1; index < boxes.length; index++) {
      expect(
        boxes[index].top - boxes[index - 1].bottom,
        `separación entre las filas ${index - 1} y ${index}`,
      ).toBeGreaterThanOrEqual(GAP);
    }
  });
});
