import { chromium } from "@playwright/test";
import { seedTestData, type SeedResult } from "./seed";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const authFiles = {
  tenant: path.join(root, ".auth-tenant.json"),
  landlord: path.join(root, ".auth-landlord.json"),
  admin: path.join(root, ".auth-admin.json"),
  whistleblower: path.join(root, ".auth-whistleblower.json"),
};

async function saveAuthState(seed: SeedResult, role: keyof typeof authFiles, baseURL: string) {
  const context = await chromium.newContext({ baseURL });
  const page = await context.newPage();
  try {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(seed.users[role].email);
    await page.getByRole("button", { name: /send code|continue/i }).click();
    const otp = process.env.TEST_OTP ?? "123456";
    const firstOtpInput = page.locator(`input[data-otp-input]`).first();
    if (await firstOtpInput.isVisible()) {
      await firstOtpInput.fill(otp);
    } else {
      const textboxes = page.getByRole("textbox");
      await textboxes.first().fill(otp);
    }
    await page.getByRole("button", { name: /verify|confirm/i }).click();
    await page.waitForURL(/dashboard/);
    await context.storageState({ path: authFiles[role] });
  } finally {
    await context.close();
  }
}

export default async function globalSetup() {
  const result = await seedTestData();
  const file = path.join(root, ".seed.json");
  fs.writeFileSync(file, JSON.stringify(result, null, 2));

  const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
  await saveAuthState(result, "tenant", baseURL);
  await saveAuthState(result, "landlord", baseURL);
  await saveAuthState(result, "admin", baseURL);
  await saveAuthState(result, "whistleblower", baseURL);
}
