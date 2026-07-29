import { cleanupTestData } from "./seed";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const authFiles = [
  path.join(root, ".auth-tenant.json"),
  path.join(root, ".auth-landlord.json"),
  path.join(root, ".auth-admin.json"),
  path.join(root, ".auth-whistleblower.json"),
];

export default async function globalTeardown() {
  const file = path.join(root, ".seed.json");
  if (!fs.existsSync(file)) return;
  const { runId } = JSON.parse(fs.readFileSync(file, "utf8"));
  await cleanupTestData(runId);
  fs.unlinkSync(file);
  for (const authFile of authFiles) {
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
    }
  }
}
