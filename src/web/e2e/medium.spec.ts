import { expect, test } from "@playwright/test";

test.describe("Medium", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/medium");
  });

  test("shows 4 elevators", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Medium — 4 Elevators/ }),
    ).toBeVisible();
    await expect(page.getByTestId("elevator-cab-1")).toBeVisible();
    await expect(page.getByTestId("elevator-cab-4")).toBeVisible();
  });

  test("request trip", async ({ page }) => {
    await page.getByTestId("pickup").fill("1");
    await page.getByTestId("destination").fill("20");
    await page.getByTestId("request-trip").click();
    await expect(
      page.getByRole("heading", { name: /Medium — 4 Elevators/ }),
    ).toBeVisible();
  });
});
