import * as dotenv from "dotenv";
import path from "path";
import { db } from "~~/services/database/config/postgresClient";
import { labProgress, user } from "~~/services/database/config/schema";
import type { LabSnapshot } from "~~/services/store/lab-persistence";

dotenv.config({ path: path.resolve(__dirname, "../../.env.development"), quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || new URL(databaseUrl).hostname !== "localhost") {
  console.error("Skipping seed: database host is not localhost");
  process.exit(0);
}

const snapshot: LabSnapshot = {
  chapterIndex: 0,
  cardIndex: 1,
  maxReached: { chapterIndex: 0, cardIndex: 1 },
  progress: {},
  transcript: { labId: "ethereum-101", events: [] },
};

async function main() {
  await db
    .insert(user)
    .values({
      id: "seed-user",
      name: "Seed User",
      email: "seed@learning-lab.local",
      emailVerified: true,
    })
    .onConflictDoNothing();
  console.log("Seeded user: seed-user");

  await db
    .insert(labProgress)
    .values({
      userId: "seed-user",
      labId: "ethereum-101",
      cardsCleared: 1,
      totalCards: 23,
      snapshot,
    })
    .onConflictDoNothing();
  console.log("Seeded lab progress: seed-user/ethereum-101");

  await db.close();
}

void main();
