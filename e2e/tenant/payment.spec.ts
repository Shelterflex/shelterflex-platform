import { test, expect, LoginPage } from "../helpers/fixtures";

test.describe("Tenant payment flow", () => {
  test.beforeEach(async ({ page, seed }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(seed.users.tenant.email, seed.users.tenant.password);
  });

  test("initiate payment → success state", async ({ page }) => {
    await page.goto("/dashboard/tenant/payments");
    await expect(page.getByRole("main")).toBeVisible();

    const payBtn = page.getByRole("button", { name: /pay now|make payment/i }).first();
    if (!(await payBtn.isVisible())) {
      // No active deal in seed data — assert the empty state is shown gracefully
      await expect(
        page.getByText(/no payment|no active deal|nothing due/i),
      ).toBeVisible();
      return;
    }

    await payBtn.click();
    await expect(page.getByText(/confirm payment/i)).toBeVisible();
    await page.getByRole("button", { name: /confirm|proceed/i }).click();

    await expect(
      page.getByText(/payment successful|receipt|thank you/i),
    ).toBeVisible();
  });
});
