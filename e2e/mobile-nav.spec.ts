import { expect, test } from "@playwright/test";

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("hamburger button opens a visible, clickable section menu", async ({
    page,
  }) => {
    await page.goto("/");

    const menu = page.locator("nav .dropdown-content");
    await expect(menu).toBeHidden();

    await page
      .getByRole("button", { name: "Abrir menú de navegación" })
      .click();

    await expect(menu).toBeVisible();

    for (const label of ["Sobre mí", "Proyectos", "Contacto"]) {
      await expect(menu.getByRole("link", { name: label })).toBeVisible();
    }

    await menu.getByRole("link", { name: "Proyectos" }).click();
    await expect(page).toHaveURL(/#proyectos$/);
    await expect(menu).toBeHidden();
    await expect(page.locator("nav details")).not.toHaveAttribute("open", "");
  });

  test("hamburger button exposes the menu to keyboard focus", async ({
    page,
  }) => {
    await page.goto("/");

    const menu = page.locator("nav .dropdown-content");
    await page
      .getByRole("button", { name: "Abrir menú de navegación" })
      .focus();
    await page.keyboard.press("Enter");

    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Sobre mí" })).toBeVisible();
  });
});
