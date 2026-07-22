import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.startsWith("pnpm/")) {
  console.error("Please use pnpm to install dependencies.");
  process.exit(1);
}

for (const file of ["package-lock.json", "yarn.lock"]) {
  const fullPath = path.join(repoRoot, file);
  if (existsSync(fullPath)) {
    console.error(`Remove ${file} and use pnpm-lock.yaml as the only dependency lockfile.`);
    process.exit(1);
  }
}
