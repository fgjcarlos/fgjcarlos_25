import { expect, test, type Page } from "@playwright/test";

// Contraste WCAG entre dos colores CSS cualesquiera (oklch incluido): el
// canvas los resuelve a sRGB, porque axe deja los oklch como "incomplete".
async function contrast(page: Page, fg: string, bg: string) {
  return page.evaluate(
    ([a, b]) => {
      const ctx = document.createElement("canvas").getContext("2d")!;
      // Un probe nuevo por color: reutilizar el mismo elemento hace que
      // Chromium devuelva el `color` computado anterior (lo tiene cacheado)
      // y todos los pares colapsan al primer color, con ratio 1.
      const luminance = (color: string) => {
        const probe = document.createElement("span");
        probe.style.color = color;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = resolved;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    },
    [fg, bg],
  );
}

const background = "var(--color-base-100)";

for (const theme of ["light", "dark"] as const) {
  test(`keeps the focus ring visible in the ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await page.keyboard.press("Tab");

    // El primer foco tras cargar la página puede leer el anillo del
    // navegador antes de que el autor aplique el suyo: se mide cuando el
    // estilo ha aterrizado.
    const ratio = async () => {
      const ring = await page.evaluate(
        () => getComputedStyle(document.activeElement!).outlineColor,
      );
      return contrast(page, ring, background);
    };

    await expect
      .poll(ratio, { message: "anillo de foco visible" })
      .toBeGreaterThanOrEqual(3);
  });
}

test.describe("Light theme: technical daylight", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("keeps every stop of the name gradient readable", async ({ page }) => {
    for (const hue of ["--fx-h1", "--fx-h2", "--fx-h3"]) {
      const stop = await page.evaluate((h) => {
        const s = getComputedStyle(document.documentElement);
        return `oklch(${s.getPropertyValue("--fx-l")} 0.15 ${s.getPropertyValue(h)})`;
      }, hue);
      expect(await contrast(page, stop, background)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  test("draws no glow and no decorative blobs", async ({ page }) => {
    // T3 (S4) quitó el chip del hero (y su punto `.cine-dot`): el glow que
    // había que vigilar en claro era el de ese punto.
    const glows = await page.evaluate(() =>
      [".cine-caso", ".cine-progress"].map(
        (selector) =>
          getComputedStyle(document.querySelector(selector)!).boxShadow,
      ),
    );
    expect(glows).toEqual(["none", "none"]);

    const blobs = await page
      .locator(".cine-blob")
      .evaluateAll(
        (elements) =>
          elements.filter((e) => e.getBoundingClientRect().width > 0).length,
      );
    expect(blobs).toBe(0);
  });

  test("sets the page on warm paper, not white", async ({ page }) => {
    const ratio = await contrast(page, background, "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(1.06);
    expect(
      await contrast(page, "var(--color-base-content)", background),
    ).toBeGreaterThanOrEqual(12);
  });
});

// T2 (S3) sustituyó los blobs decorativos por capturas de la UI real de cada
// proyecto: la decoración del tema oscuro ahora son esas capturas.
test("keeps the dark theme project screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const shots = page.locator("article.cine-project img");
  await expect(shots).toHaveCount(4);

  for (let i = 0; i < 4; i++) {
    const shot = shots.nth(i);
    await expect(shot).toHaveAttribute("alt", /\S/);
    await shot.scrollIntoViewIfNeeded();
    expect(
      await shot.evaluate((el) => (el as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
  }
});

// S7: en oscuro el CTA de cada panel no lleva halo de color sin
// desplazamiento: la profundidad es una sombra con offset y desenfoque.
test("keeps the dark CTA without a zero-offset halo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/");

  const cta = page.locator("a.cine-caso").first();
  await expect(cta).toBeVisible();

  const shadow = await cta.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  );

  const shadows = [
    ...shadow.matchAll(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/g),
  ];

  if (shadow !== "none") {
    expect(shadows.length, `sombras de la CTA: ${shadow}`).toBeGreaterThan(0);
  }

  for (const [, x, y, blur] of shadows) {
    expect(
      Number(x) === 0 && Number(y) === 0,
      `una sombra sin desplazamiento es decoración: ${shadow}`,
    ).toBe(false);
    expect(Number(blur), "la sombra lleva desenfoque").toBeGreaterThan(0);
  }
});
