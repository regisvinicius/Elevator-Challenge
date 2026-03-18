import { expect, test } from "@playwright/test";

test("E1: navigates between tabs without crash", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Elevator System/i }),
  ).toBeVisible();

  await page.getByTestId("nav-easy").click();
  await expect(page.getByText(/Easy.*Single Elevator/i)).toBeVisible();

  await page.getByTestId("nav-medium").click();
  await expect(page.getByText(/Medium.*4 Elevators/i)).toBeVisible();

  await page.getByTestId("nav-enterprise").click();
  await expect(page.getByText(/Enterprise.*5 Elevators/i)).toBeVisible();

  await page.getByTestId("nav-concurrency").click();
  await expect(
    page.getByRole("heading", { name: /Stress Test/ }),
  ).toBeVisible();
});
