import { expect, test } from "@playwright/test";

const anchorTargets = ["sobre-mi", "proyectos", "contacto"];

test.describe("Anchor section navigation", () => {
  test("uses smooth scrolling and exposes every section anchor", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");

    for (const id of anchorTargets) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("lands each nav link exactly on its section", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const nav = page.getByRole("navigation");
    const settle = () => page.waitForTimeout(300);

    await nav.getByRole("link", { name: "Proyectos" }).click();
    await settle();
    const projectsTop = await page
      .locator("#proyectos")
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(Math.round(projectsTop)).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 3000));
    await nav.getByRole("link", { name: "Sobre mí" }).click();
    await settle();
    // T4 (S5): "Sobre mí" ya no es el hero, es su propio panel en la pila.
    await expect
      .poll(() =>
        page
          .locator("#sobre-mi")
          .evaluate((element) =>
            Math.round(element.getBoundingClientRect().top),
          ),
      )
      .toBe(0);

    await nav.getByRole("link", { name: "Contacto" }).click();
    await settle();
    const footerVisible = await page
      .locator("#contacto")
      .evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight + 1;
      });
    expect(footerVisible).toBe(true);
  });

  test("keeps anchor links navigable by hash", async ({ page }) => {
    await page.goto("/");

    for (const [label, hash] of [
      ["Sobre mí", "#sobre-mi"],
      ["Proyectos", "#proyectos"],
      ["Contacto", "#contacto"],
    ] as const) {
      await page.getByRole("link", { name: label }).first().click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
    }
  });

  test("disables smooth scrolling for reduced-motion users", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  });

  test("takes the nav links from a project page to the home sections", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/projects/mcm");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Proyectos" })
      .click();
    await page.waitForURL(/\/#proyectos$/);
    await expect
      .poll(() =>
        page
          .locator("#proyectos")
          .evaluate((element) =>
            Math.round(element.getBoundingClientRect().top),
          ),
      )
      .toBe(0);

    await page.goto("/projects/mcm");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Sobre mí" })
      .click();
    await page.waitForURL(/\/#sobre-mi$/);
    // T4 (S5): el ancla "Sobre mí" es el panel nuevo, no el hero.
    await expect
      .poll(() =>
        page
          .locator("#sobre-mi")
          .evaluate((element) =>
            Math.round(element.getBoundingClientRect().top),
          ),
      )
      .toBe(0);
  });
});
