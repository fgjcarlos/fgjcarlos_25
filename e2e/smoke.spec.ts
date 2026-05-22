import { test, expect } from "@playwright/test";

test.describe("Smoke: Home page", () => {
  test("has expected title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Carlos Fontán/);
  });

  test("profile image renders", async ({ page }) => {
    await page.goto("/");
    const img = page.locator('img[alt*="Carlos"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", /.+/);
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
    const sobreMiLink = page.locator('a[href="#sobre-mi"]').first();
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
