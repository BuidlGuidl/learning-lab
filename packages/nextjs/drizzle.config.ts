import { isLocalUrl, requireDatabaseUrl } from "./services/database/config/databaseUrl";
import { spawnSync } from "child_process";
import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { join } from "path";

// .env.local first: it wins over .env.development, same priority Next.js uses.
dotenv.config({ path: join(__dirname, ".env.local"), quiet: true });
dotenv.config({ path: join(__dirname, ".env.development"), quiet: true });

const databaseUrl = requireDatabaseUrl();
const SKIP_PROMPT = process.env.VERCEL === "1";

// Anything that is not a local database gets a confirm, so the guard fails closed.
if (!SKIP_PROMPT && !isLocalUrl(databaseUrl)) {
  process.stdout.write("\n⚠️ You are pointing to a non-local database. Are you sure you want to proceed? (y/N): ");

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
    url: databaseUrl,
  },
});
