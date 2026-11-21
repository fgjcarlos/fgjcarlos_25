import { test, expect } from "@playwright/test";

test.describe("Smoke: Home page", () => {
  test("has expected title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Carlos Fontán/);
  });

  test("social links have valid href and open in new tab", async ({ page }) => {
    await page.goto("/");
    const socialLinks = page.locator('a[target="_blank"][rel*="noopener"]');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await socialLinks.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("");
    }
  });

  test("navbar anchor links are present", async ({ page }) => {
    await page.goto("/");
    const sobreMiLink = page.locator('a[href="/#sobre-mi"]').first();
    await expect(sobreMiLink).toBeVisible();
  });

  test("projects section renders without crashing", async ({ page }) => {
    await page.goto("/");
    // Section may be empty (all drafts) but must not throw
    // Projects component is only shown if imported in index.astro
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("404 page renders", async ({ page }) => {
    const response = await page.goto("/pagina-que-no-existe");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Theme default", () => {
  test("opens in dark mode when no theme was chosen", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("keeps a stored light choice across reloads and navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.goto("/projects/mcm");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
