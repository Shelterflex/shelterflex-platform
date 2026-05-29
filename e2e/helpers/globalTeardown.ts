import { cleanupTestData } from "./seed";
import fs from "fs";
import path from "path";

export default async function globalTeardown() {
  const file = path.join(process.cwd(), "e2e/.seed.json");
  if (!fs.existsSync(file)) return;
  const { runId } = JSON.parse(fs.readFileSync(file, "utf8"));
  await cleanupTestData(runId);
  fs.unlinkSync(file);
}
