import * as dotenv from "dotenv";
import path from "path";
import type { LabSnapshot } from "~~/lib/lab/snapshot";
import { isLocalUrl } from "~~/services/database/config/databaseUrl";
import { db } from "~~/services/database/config/postgresClient";
import { upsertLabProgress } from "~~/services/database/repositories/labProgress";
import { createUser } from "~~/services/database/repositories/users";

dotenv.config({ path: path.resolve(__dirname, "../../.env.development"), quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !isLocalUrl(databaseUrl)) {
  console.error("Refusing to seed: database host is not local");
  process.exit(1);
}

const snapshot: LabSnapshot = {
  chapterIndex: 0,
  cardIndex: 1,
  maxReached: { chapterIndex: 0, cardIndex: 1 },
  progress: {},
  transcript: { labId: "ethereum-101", events: [] },
};

async function main() {
  try {
    await createUser({
      id: "seed-user",
      name: "Seed User",
      email: "seed@learning-lab.local",
      emailVerified: true,
    });
    console.log("Seeded user: seed-user");
  } catch (error) {
    // 23505 = unique violation: the seed user is already there, anything else is a real failure.
    if ((error as { cause?: { code?: string } }).cause?.code !== "23505") throw error;
    console.log("Seed user already exists");
  }

  await upsertLabProgress({
    userId: "seed-user",
    labId: "ethereum-101",
    snapshot,
    cardsCleared: 1,
    totalCards: 23,
  });
  console.log("Seeded lab progress: seed-user/ethereum-101");

  await db.close();
}

void main().catch(error => {
  console.error(error);
  process.exit(1);
});
