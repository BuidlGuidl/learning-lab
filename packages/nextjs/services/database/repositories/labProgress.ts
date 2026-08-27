import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { labProgress } from "~~/services/database/config/schema";

export type LabProgress = InferSelectModel<typeof labProgress>;
export type LabProgressInsert = InferInsertModel<typeof labProgress>;

export async function getLabProgress(userId: string, labId: string) {
  return await db.query.labProgress.findFirst({
    where: and(eq(labProgress.userId, userId), eq(labProgress.labId, labId)),
  });
}

export async function getLabProgressByUser(userId: string) {
  return await db.query.labProgress.findMany({
    where: eq(labProgress.userId, userId),
  });
}

export async function upsertLabProgress({
  userId,
  labId,
  snapshot,
  cardsCleared,
  totalCards,
}: Pick<LabProgressInsert, "userId" | "labId" | "snapshot" | "cardsCleared" | "totalCards">) {
  const [row] = await db
    .insert(labProgress)
    .values({ userId, labId, snapshot, cardsCleared, totalCards })
    .onConflictDoUpdate({
      target: [labProgress.userId, labProgress.labId],
      set: { snapshot, cardsCleared, totalCards, updatedAt: sql`now()` },
    })
    .returning();

  return row;
}
