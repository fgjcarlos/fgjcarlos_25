import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const HOME = "/";

/** El rol y el email se leen de la configuración real, no se escriben aquí. */
const config = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../src/config/${name}.json`, import.meta.url),
      "utf8",
    ),
  ) as Record<string, unknown>;

const ROLE = config("profile").title as string;
const LINKS = config("links").links as { src: string; title: string }[];
const MAIL = LINKS.find((link) => link.src.startsWith("mailto:"))!;
const EMAIL = MAIL.src.replace("mailto:", "");
const OTHER_LINKS = LINKS.filter((link) => !link.src.startsWith("mailto:"));

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

/**
 * Contraste WCAG entre dos colores CSS cualesquiera (oklch incluido): el
 * canvas los resuelve a sRGB, porque axe deja los oklch como "incomplete".
 */
async function contrast(page: Page, fg: string, bg: string): Promise<number> {
  return page.evaluate(
    ([a, b]) => {
      const ctx = document.createElement("canvas").getContext("2d")!;
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

/** Color propio de un elemento (texto o fondo). */
async function paint(
  page: Page,
  selector: string,
  property: "color" | "background-color",
): Promise<string> {
  return page
    .locator(selector)
    .evaluate(
      (element, key) => getComputedStyle(element).getPropertyValue(key),
      property,
    );
}

test.describe("Hero: role, projects and email", () => {
  test("offers the published projects and the email as the two hero actions", async ({
    page,
  }) => {
    await openHome(page);

    const published = await page.locator("#proyectos article").count();

    const projects = page.locator('#sobre-mi a[href="#proyectos"]');
    await expect(projects).toHaveCount(1);
    await expect(projects).toHaveText(
      new RegExp(`ver los ${published} proyectos`),
    );

    const mail = page.locator(`#sobre-mi a[href="mailto:${EMAIL}"]`);
    await expect(mail).toHaveCount(1);
    await expect(mail).toHaveText(EMAIL);
    await expect(mail).toBeVisible();
  });

  test("drops the eyebrow chip and keeps the role with the name", async ({
    page,
  }) => {
    await openHome(page);

    await expect(page.locator(".cine-badge")).toHaveCount(0);

    const role = page.locator("#sobre-mi .cine-role");
    await expect(role).toHaveText(ROLE);
    // El rol acompaña al nombre: nunca queda por encima del titular.
    await expect(page.locator("#sobre-mi h1")).toHaveText("Carlos Fontán");

    const roleAfterName = await page.evaluate(() => {
      const name = document.querySelector("#sobre-mi h1")!;
      const role = document.querySelector("#sobre-mi .cine-role")!;

      return Boolean(
        name.compareDocumentPosition(role) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    expect(roleAfterName).toBe(true);
  });

  test("no longer claims visión artificial in the hero nor in the meta description", async ({
    page,
  }) => {
    await openHome(page);

    await expect(page.locator("#sobre-mi")).not.toContainText(
      "visión artificial",
    );

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");

    expect(description).not.toContain("visión artificial");
  });
});

test.describe("Hero and contact panel in both themes", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`keeps the new hero actions and the contact email readable in the ${theme} theme`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await openHome(page);

      const paper = await paint(page, "#sobre-mi", "background-color");

      for (const selector of [".cine-role", ".cine-action-mail"]) {
        const color = await paint(page, selector, "color");
        expect(
          await contrast(page, color, paper),
          `contraste de ${selector}`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      const ctaColor = await paint(page, ".cine-action-primary", "color");
      const ctaBackground = await paint(
        page,
        ".cine-action-primary",
        "background-color",
      );
      expect(
        await contrast(page, ctaColor, ctaBackground),
        "contraste de la acción principal",
      ).toBeGreaterThanOrEqual(4.5);

      const mail = await paint(page, "#contacto .cine-mail", "color");
      expect(
        await contrast(page, mail, paper),
        "contraste del email de contacto",
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

test.describe("Contact panel", () => {
  test("lands the nav Contacto on the panel at the top of the viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Contacto" })
      .click();

    await expect
      .poll(() => topOf(page, "#contacto"), {
        message: "el panel de contacto debe quedar en el borde superior",
      })
      .toBe(0);

    const mail = page.locator(`#contacto a[href="mailto:${EMAIL}"]`);
    await expect(mail).toBeVisible();

    // El panel no puede quedar tapado por la barra flotante.
    const nav = await page.locator("nav").boundingBox();
    const mailBox = await mail.boundingBox();

    expect(nav).not.toBeNull();
    expect(mailBox).not.toBeNull();
    expect(mailBox!.y).toBeGreaterThan(nav!.y + nav!.height);
  });

  test("writes the email large and repeats the other contact links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const mail = page.locator(`#contacto a[href="mailto:${EMAIL}"]`);
    await expect(mail).toHaveText(EMAIL);

    const fontSize = await mail.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(24);

    for (const link of OTHER_LINKS) {
      await expect(
        page.locator(`#contacto a[href="${link.src}"]`),
        `contact link ${link.title}`,
      ).toHaveCount(1);
    }
  });

  test("joins the sticky stack of panels on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const panel = await page.locator("#contacto").evaluate((element) => {
      const computed = getComputedStyle(element);

      return {
        position: computed.position,
        height: element.getBoundingClientRect().height,
      };
    });

    expect(panel.position).toBe("sticky");
    expect(panel.height).toBe(900);
  });

  test("keeps the focused email visible inside the panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const mail = page.locator(`#contacto a[href="mailto:${EMAIL}"]`);
    await mail.focus();

    await expect.poll(() => topOf(page, "#contacto")).toBe(0);

    const nav = await page.locator("nav").boundingBox();
    const mailBox = await mail.boundingBox();

    expect(mailBox).not.toBeNull();
    expect(mailBox!.y).toBeGreaterThan(nav!.y + nav!.height);
  });

  test("does not overflow horizontally on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    await page.locator("#contacto").scrollIntoViewIfNeeded();

    const measure = await page.evaluate((email) => {
      const panel = document.querySelector("#contacto")!;
      const mail = panel.querySelector<HTMLAnchorElement>(
        `a[href="mailto:${email}"]`,
      )!;
      const box = mail.getBoundingClientRect();

      return {
        documentOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        panelOverflow: panel.scrollWidth - panel.clientWidth,
        left: box.left,
        right: box.right,
        viewport: window.innerWidth,
      };
    }, EMAIL);

    expect(measure.documentOverflow).toBeLessThanOrEqual(0);
    expect(measure.panelOverflow).toBeLessThanOrEqual(0);
    expect(measure.left).toBeGreaterThanOrEqual(0);
    expect(measure.right).toBeLessThanOrEqual(measure.viewport);
  });
});
