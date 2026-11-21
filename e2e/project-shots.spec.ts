import { expect, test, type Page } from "@playwright/test";

const HOME = "/";

/**
 * Abre la home con las animaciones de entrada resueltas: el reveal por
 * IntersectionObserver deja el contenido visible y las imágenes lazy cargan
 * al entrar en pantalla.
 */
async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Home: capturas de la UI real de cada proyecto", () => {
  test("cada panel muestra su captura a la derecha del titular, cargada y sin blobs", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const panels = page.locator("article.cine-project");
    await expect(panels).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const panel = panels.nth(i);
      await panel.scrollIntoViewIfNeeded();

      const image = panel.locator("img");
      await expect(image).toHaveCount(1);

      const alt = await image.getAttribute("alt");
      expect(
        alt?.trim(),
        "la captura necesita un alt descriptivo",
      ).toBeTruthy();

      // La imagen llega a cargarse (naturalWidth > 0).
      await expect
        .poll(
          () => image.evaluate((el) => (el as HTMLImageElement).naturalWidth),
          { timeout: 10_000 },
        )
        .toBeGreaterThan(0);

      const box = (await image.boundingBox())!;
      const title = (await panel.locator("h2").boundingBox())!;

      // La captura vive en la columna derecha, sin solaparse con el titular.
      expect(box.x).toBeGreaterThan(title.x);
      expect(
        box.x >= title.x + title.width - 1,
        "la captura no debe pisar el titular",
      ).toBe(true);
      expect(box.x + box.width).toBeLessThanOrEqual(1440);
    }
  });

  test("en móvil la captura no desborda y cabe en el ancho del panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, "sin desbordamiento horizontal").toBeLessThanOrEqual(0);

    const panels = page.locator("article.cine-project");
    await expect(panels).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const panel = panels.nth(i);
      await panel.scrollIntoViewIfNeeded();

      const image = panel.locator("img");
      await expect(image).toHaveCount(1);

      const panelBox = (await panel.boundingBox())!;
      const imageBox = (await image.boundingBox())!;
      expect(imageBox.width).toBeLessThanOrEqual(panelBox.width);
      expect(imageBox.x).toBeGreaterThanOrEqual(panelBox.x - 1);
      expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(
        panelBox.x + panelBox.width + 1,
      );
    }
  });

  test("no queda ninguna decoración de blobs en los paneles", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    await expect(page.locator(".cine-blob")).toHaveCount(0);
    await expect(page.locator(".cine-art")).toHaveCount(0);
  });
});
