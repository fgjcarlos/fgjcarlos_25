import { expect, test } from "@playwright/test";

const anchorTargets = ["sobre-mi", "proyectos", "contacto"];

test.describe("Anchor section navigation", () => {
  test("uses smooth scrolling and reserves top offset for section anchors", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "smooth");

    for (const id of anchorTargets) {
      const target = page.locator(`#${id}`);
      await expect(target).toHaveCount(1);
      await expect(target).not.toHaveCSS("scroll-margin-top", "0px");
    }
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
});
