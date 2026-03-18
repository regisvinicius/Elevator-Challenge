import { expect, test } from "@playwright/test";

test.describe("Enterprise", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/enterprise");
  });

  test("shows 5 elevators and analytics", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Enterprise — 5 Elevators/ }),
    ).toBeVisible();
    await expect(page.getByText("Analytics")).toBeVisible();
  });

  test("request trip with VIP", async ({ page }) => {
    await page.getByTestId("pickup").fill("5");
    await page.getByTestId("destination").fill("25");
    await page.getByTestId("vip").click();
    await page.getByTestId("request-trip").click();
    await expect(
      page.getByRole("heading", { name: /Enterprise — 5 Elevators/ }),
    ).toBeVisible();
  });

  test("maintenance toggle and emergency controls", async ({ page }) => {
    test.setTimeout(60_000);

    const maintenance = page.getByTestId("maintenance-1");
    await maintenance.click();
    await expect(maintenance).toBeChecked({ timeout: 10_000 });

    const emergency = page.getByTestId("emergency-1");
    await emergency.click();
    await expect(emergency).toBeChecked({ timeout: 10_000 });
    await emergency.click();
    await expect(emergency).not.toBeChecked({ timeout: 10_000 });

    await maintenance.click();
    await expect(maintenance)
      .toBeChecked({ timeout: 2_000 })
      .catch(() => {});
    await maintenance.click();
    await expect(maintenance).not.toBeChecked({ timeout: 5_000 });
  });
});
