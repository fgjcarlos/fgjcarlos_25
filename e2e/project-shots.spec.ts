import { expect, test, type Page } from "@playwright/test";

const HOME = "/";

/**
 * Abre la home con la página ya asentada: las fuentes cargadas, las
 * imágenes decodificadas y las animaciones de entrada terminadas.
 *
 * El ancho del documento se mide sobre ese estado: medir mientras la fuente
 * de display aún no ha cambiado o mientras una imagen lazy se decodifica
 * devuelve una maqueta que no es la final (fue el origen de un fallo
 * intermitente de "la captura no desborda").
 */
async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);
  await settle(page);
}

/** Espera a que la página se asiente del todo. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    // Un ciclo de estilo: el navegador puede leer medidas antes de aplicar
    // el último cambio de maquetación.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

test.describe("Home: paneles de proyecto sin capturas", () => {
  test("sin capturas, ningún panel pinta marco ni imagen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const panels = page.locator("article.cine-project");
    await expect(panels).toHaveCount(4);

    // El usuario retiró las capturas: los paneles son texto hasta que
    // aporte las suyas en `src/assets/projects/<slug>-ui.*`.
    await expect(page.locator(".cine-shot")).toHaveCount(0);
    await expect(page.locator("article.cine-project img")).toHaveCount(0);
  });

  test("la columna de texto no se mueve al faltar la captura", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const panel = page.locator("article.cine-project").first();
    await panel.scrollIntoViewIfNeeded();

    const panelBox = (await panel.boundingBox())!;
    const copyBox = (await panel.locator(".cine-copy").boundingBox())!;
    const titleBox = (await panel.locator("h2").boundingBox())!;

    // El titular sigue pegado al padding del panel (7vw), igual que cuando
    // había captura: la columna de texto no cambia de ancho ni de posición.
    expect(Math.abs(titleBox.x - copyBox.x)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(titleBox.x - (panelBox.x + 1440 * 0.07)),
      "el h2 no se desplaza",
    ).toBeLessThanOrEqual(2);
  });

  test("no desborda en horizontal a 1440 ni a 390", async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({
        width,
        height: width === 390 ? 844 : 900,
      });
      await openHome(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        `sin desbordamiento horizontal a ${width}`,
      ).toBeLessThanOrEqual(0);
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
