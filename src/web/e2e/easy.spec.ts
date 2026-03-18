import { expect, test } from "@playwright/test";

test.describe("Easy", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/easy");
  });

  test("shows elevator status", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Easy — Single Elevator/ }),
    ).toBeVisible();
    await expect(page.getByText("Elevator", { exact: true })).toBeVisible();
  });

  test("request elevator and process", async ({ page }) => {
    await page.getByTestId("easy-floor").fill("3");
    await page.getByTestId("easy-direction").selectOption("Up");
    await page.getByTestId("request-elevator").click();

    await page.getByTestId("process-requests").click();
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("elevator-cab-1")).toHaveAttribute(
      "aria-label",
      /Floor 3/,
    );
  });
});
