import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

export default defineConfig({
  testDir: path.join(root, "."),
  timeout: 30_000,
  retries: 2,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(root, "playwright-report") }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  outputDir: path.join(root, "test-results/e2e"),
  globalSetup: path.join(root, "helpers/globalSetup.ts"),
  globalTeardown: path.join(root, "helpers/globalTeardown.ts"),
});
