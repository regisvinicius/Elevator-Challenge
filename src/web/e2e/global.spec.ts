import { expect, test } from "@playwright/test";

test.describe("Global", () => {
  test("API Docs link is visible", async ({ page }) => {
    await page.goto("/");
    const apiDocsLink = page.getByTestId("api-docs");
    await expect(apiDocsLink).toBeVisible();
    await expect(apiDocsLink).toHaveAttribute("href", /\/swagger/);
  });

  test("dark mode toggle", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("elevator-theme"));
    await page.reload();

    const toggle = page.getByTestId("dark-mode-toggle");
    await expect(toggle).toBeVisible();

    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
    await expect(toggle).toHaveText(/Light/);

    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
