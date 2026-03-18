import { expect, test } from "@playwright/test";

test.describe("Concurrency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/concurrency");
  });

  test("stress test fire burst", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Stress Test/ }),
    ).toBeVisible();

    await page.getByTestId("fire-50").click();

    await expect(page.getByTestId("stress-result")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("stress-result")).toContainText(
      /Sent 50 requests in/,
    );
  });
});
