import { expect, test } from "@playwright/test";

test.describe("Page transitions", () => {
  test("keeps the shared shell stable when navigating between home and project detail", async ({
    page,
  }) => {
    await page.goto("/");

    const shell = page.locator("main");
    const nav = page.locator("nav");
    const beforeShellBox = await shell.boundingBox();
    const beforeNavBox = await nav.boundingBox();

    expect(beforeShellBox).not.toBeNull();
    expect(beforeNavBox).not.toBeNull();

    await page.locator('#proyectos a[href^="/projects/"]').first().click();
    await page.waitForURL(/\/projects\//);

    const afterShellBox = await shell.boundingBox();
    const afterNavBox = await nav.boundingBox();

    expect(afterShellBox).not.toBeNull();
    expect(afterNavBox).not.toBeNull();
    expect(afterShellBox?.x).toBeCloseTo(beforeShellBox!.x, 0);
    expect(afterShellBox?.width).toBeCloseTo(beforeShellBox!.width, 0);
    expect(afterNavBox?.y).toBeCloseTo(beforeNavBox!.y, 0);
  });

  test("does not replay transform-based entrance animations during client navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('#proyectos a[href^="/projects/"]').first().click();
    await page.waitForURL(/\/projects\//);

    const detailContent = page.locator("article").first();
    await expect(detailContent).toBeVisible();
    await expect(detailContent).toHaveCSS("animation-name", "none");
    await expect(detailContent).toHaveCSS("transform", "none");
  });

  test("reserves a stable aspect ratio for project cover images", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator('#proyectos a[href^="/projects/"]').first().click();
    await page.waitForURL(/\/projects\//);

    const cover = page.locator("article > div.rounded-box").first();
    await expect(cover).toBeVisible();
    await expect(cover).not.toHaveCSS("aspect-ratio", "auto");
  });
});
