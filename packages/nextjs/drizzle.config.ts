import { spawnSync } from "child_process";
import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { join } from "path";

dotenv.config({ path: ".env.development", quiet: true });

const PRODUCTION_DATABASE_HOSTNAME = "neon";
const SKIP_PRODUCTION_DATABASE_PROMPT = process.env.VERCEL === "1";

// A Vercel build with the env var missing would otherwise migrate against the localhost fallback.
if (process.env.VERCEL === "1" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set on Vercel");
}

if (!SKIP_PRODUCTION_DATABASE_PROMPT && process.env.DATABASE_URL?.includes(PRODUCTION_DATABASE_HOSTNAME)) {
  process.stdout.write("\n⚠️ You are pointing to the production database. Are you sure you want to proceed? (y/N): ");

  const result = spawnSync("tsx", [join(__dirname, "utils/prompt-confirm.ts")], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.log("Aborted.");
    process.exit(1);
  }
}

export default defineConfig({
  schema: "./services/database/config/schema.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
