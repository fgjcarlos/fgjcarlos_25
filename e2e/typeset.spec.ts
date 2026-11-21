import { expect, test, type Page } from "@playwright/test";

/**
 * Tipografía (S6): la voz de display es una cara real y propia, el degradado
 * del apellido cubre la palabra (no el titular entero), la prosa del proyecto
 * tiene medida legible, el foco no se esconde bajo la barra flotante en
 * móvil, los encabezados respiran más arriba que abajo y los títulos con
 * guion no se parten por dentro.
 */

const DISPLAY_FACE = "Archivo";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

test.describe("Home: display voice", () => {
  test("the surname gradient covers the word, not the whole heading", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openHome(page);

    const measure = await page.evaluate(() => {
      const heading = document.querySelector(".cine-hero h1")!;
      const gradient = document.querySelector(".cine-grad")!;
      const range = document.createRange();
      range.selectNodeContents(gradient);

      return {
        headingWidth: heading.getBoundingClientRect().width,
        boxWidth: gradient.getBoundingClientRect().width,
        textWidth: range.getBoundingClientRect().width,
        backgroundImage: getComputedStyle(gradient).backgroundImage,
      };
    });

    // El degradado sigue siendo el mismo: tres paradas de la paleta.
    expect(measure.backgroundImage).toContain("gradient");
    expect(measure.backgroundImage).toContain("296");

    // La caja del degradado es la de la palabra, no la del titular.
    expect(measure.boxWidth).toBeLessThanOrEqual(measure.textWidth + 2);
    expect(measure.boxWidth).toBeLessThan(measure.headingWidth * 0.7);
  });

  test("the display voice is a self-hosted face, not the platform sans", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openHome(page);

    const family = await page
      .locator(".cine-disp")
      .first()
      .evaluate((element) => getComputedStyle(element).fontFamily);

    expect(family.split(",")[0].replace(/["']/g, "").trim()).toBe(DISPLAY_FACE);

    const loaded = await page.evaluate((face) => {
      const faces = Array.from(document.fonts).filter((font) =>
        font.family.includes(face),
      );

      return {
        checked: document.fonts.check(`900 100px "${face}"`),
        loaded: faces.some((font) => font.status === "loaded"),
      };
    }, DISPLAY_FACE);

    expect(loaded.checked).toBe(true);
    expect(loaded.loaded).toBe(true);
  });

  test("the display voice keeps a heavy weight and a readable tracking", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openHome(page);

    const style = await page.locator(".cine-hero h1").evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        weight: Number(computed.fontWeight),
        tracking: Number.parseFloat(computed.letterSpacing),
        fontSize: Number.parseFloat(computed.fontSize),
      };
    });

    expect(style.weight).toBeGreaterThanOrEqual(800);
    // El tracking nunca más cerrado que el suelo de la casa.
    expect(style.tracking / style.fontSize).toBeGreaterThanOrEqual(-0.04);
  });
});

test.describe("Project detail: measure", () => {
  test("keeps the prose within a readable measure", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/projects/mcm");
    await page.evaluate(() => document.fonts.ready);

    const characters = await page.evaluate(() => {
      const paragraph = document.querySelector(".prose p")!;
      const computed = getComputedStyle(paragraph);
      const context = document.createElement("canvas").getContext("2d")!;
      context.font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const sample = context.measureText("0".repeat(100)).width;

      return paragraph.getBoundingClientRect().width / (sample / 100);
    });

    expect(characters).toBeLessThanOrEqual(75);
    expect(characters).toBeGreaterThanOrEqual(60);
  });
});

test.describe("Home: focus and rhythm", () => {
  test("keeps a keyboard-focused link clear of the floating nav on a phone", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await openHome(page);

    // Se alcanza el enlace del último panel con el teclado: el navegador lo
    // trae a la vista y lo deja pegado al borde superior, donde lo tapa la
    // barra flotante.
    const last = page.locator("#proyectos article").last();
    const previous = last.getByRole("link", { name: /ver caso completo/ });
    const target = last.getByRole("link", { name: "código" });

    await previous.focus();
    // El enlace queda asomando por encima del borde: el foco tiene que
    // despegarlo de la barra.
    await page.evaluate(() => {
      const articles = document.querySelectorAll("#proyectos article");
      const links = articles[articles.length - 1].querySelectorAll("a");
      const link = links[links.length - 1];
      const top = link.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + 4);
    });
    await page.keyboard.press("Tab");

    await expect(target).toBeFocused();

    const nav = await page.locator("nav").boundingBox();
    const link = await target.boundingBox();

    expect(nav).not.toBeNull();
    expect(link).not.toBeNull();
    // El enlace enfocado no queda bajo la barra flotante.
    expect(link!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
  });

  for (const viewport of [DESKTOP, MOBILE]) {
    test(`gives the project heading more room above than below (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openHome(page);

      const spaces = await page.evaluate(() => {
        const article = document.querySelector("#proyectos article")!;
        const heading = article.querySelector("h2")!;
        const previous = heading.previousElementSibling!;
        const next = heading.nextElementSibling!;

        return {
          above:
            heading.getBoundingClientRect().top -
            previous.getBoundingClientRect().bottom,
          below:
            next.getBoundingClientRect().top -
            heading.getBoundingClientRect().bottom,
        };
      });

      expect(spaces.above).toBeGreaterThan(spaces.below);
    });
  }

  test("keeps the about panel heading with more room above than below", async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openHome(page);

    const spaces = await page.evaluate(() => {
      const panel = document.querySelector("#sobre-mi")!;
      const heading = panel.querySelector("h2")!;
      const next = heading.nextElementSibling!;

      return {
        above:
          heading.getBoundingClientRect().top -
          panel.getBoundingClientRect().top,
        below:
          next.getBoundingClientRect().top -
          heading.getBoundingClientRect().bottom,
      };
    });

    expect(spaces.above).toBeGreaterThan(spaces.below);
  });
});

test.describe("Home: titles with hyphens", () => {
  test("never breaks inside a hyphenated token on a phone", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await openHome(page);

    const lines = await page.evaluate(() => {
      const heading = Array.from(
        document.querySelectorAll("#proyectos article h2"),
      ).find((element) => element.textContent?.includes("Node"))!;

      const text = heading.textContent ?? "";
      const match = /Node[-‐‑‒–—]RED/.exec(text);
      if (!match) return { found: false, tops: [] as number[] };

      // Rango sobre el token,;nodos de texto y elementos.
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      let position = 0;
      let startNode: Node | undefined;
      let startOffset = 0;
      let endNode: Node | undefined;
      let endOffset = 0;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const length = node.textContent?.length ?? 0;
        if (!startNode && match.index! < position + length) {
          startNode = node;
          startOffset = match.index! - position;
        }
        if (match.index! + match[0].length <= position + length) {
          endNode = node;
          endOffset = match.index! + match[0].length - position;
          break;
        }
        position += length;
      }

      const range = document.createRange();
      if (!startNode || !endNode) return { found: false, tops: [] as number[] };
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      return {
        found: true,
        tops: Array.from(range.getClientRects()).map((rect) =>
          Math.round(rect.top),
        ),
      };
    });

    expect(lines.found).toBe(true);
    expect(lines.tops.length).toBeGreaterThan(0);
    // Todas las partes del token comparten línea.
    expect(
      Math.max(...lines.tops) - Math.min(...lines.tops),
    ).toBeLessThanOrEqual(1);
  });

  for (const width of [320, 390]) {
    test(`does not overflow horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openHome(page);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );

      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
