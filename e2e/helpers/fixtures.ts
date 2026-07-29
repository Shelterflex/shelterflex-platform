import { test as base, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SeedResult } from "./seed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const authStateFiles = {
  tenant: path.join(root, ".auth-tenant.json"),
  landlord: path.join(root, ".auth-landlord.json"),
  admin: path.join(root, ".auth-admin.json"),
  whistleblower: path.join(root, ".auth-whistleblower.json"),
};

export function loadSeed(): SeedResult {
  const file = path.join(root, ".seed.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, _password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByRole("button", { name: /send code|continue/i }).click();
    const otp = process.env.TEST_OTP ?? "123456";
    await this.page.getByRole("textbox").first().fill(otp);
    await this.page.getByRole("button", { name: /verify|confirm/i }).click();
    await this.page.waitForURL(/dashboard/);
  }
}

export const test = base.extend<{ seed: SeedResult }>({
  seed: async ({}, use) => {
    await use(loadSeed());
  },
});

export const tenantTest = test.extend({
  storageState: authStateFiles.tenant,
});

export const landlordTest = test.extend({
  storageState: authStateFiles.landlord,
});

export const adminTest = test.extend({
  storageState: authStateFiles.admin,
});

export const whistleblowerTest = test.extend({
  storageState: authStateFiles.whistleblower,
});

export { expect } from "@playwright/test";
