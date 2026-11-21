import { expect, test } from "@playwright/test";

/**
 * S7: el reveal por IntersectionObserver tiene que mostrar cualquier
 * elemento, también los que son más altos que la ventana. Con un umbral del
 * 20 % un bloque de más de cinco pantallas nunca llega al 20 % visible y se
 * queda invisible para siempre.
 *
 * El caso se reproduce inyectando el bloque en el HTML servido (antes de que
 * corra el script de la home), no por una clase o un atributo interno: es la
 * misma vía pública que usa la página.
 */

const HOME = "/";

test("un bloque más alto que cinco pantallas se revela igual", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route(
    (url) => url.pathname === "/",
    async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      await route.fulfill({
        response,
        body: body.replace(
          "</body>",
          `<div id="bloque-alto" data-fx-reveal style="height:600vh"></div></body>`,
        ),
      });
    },
  );

  await page.goto(HOME);

  const block = page.locator("#bloque-alto");
  await expect(block).toHaveCount(1);

  // Antes de entrar en pantalla está oculto (el reveal lo espera).
  const hidden = await block.evaluate(
    (element) => getComputedStyle(element).opacity,
  );
  expect(hidden, "el bloque empieza oculto").toBe("0");

  await block.scrollIntoViewIfNeeded();

  await expect
    .poll(
      () => block.evaluate((element) => getComputedStyle(element).opacity),
      { timeout: 5000 },
    )
    .toBe("1");
});

test("el reveal se respeta con movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);

  const reveals = page.locator("[data-fx-reveal]");
  const count = await reveals.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index++) {
    await expect
      .poll(() =>
        reveals
          .nth(index)
          .evaluate((element) => getComputedStyle(element).opacity),
      )
      .toBe("1");
  }
});
