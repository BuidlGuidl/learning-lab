import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { user } from "~~/services/database/config/schema";

export type User = InferSelectModel<typeof user>;
export type UserInsert = InferInsertModel<typeof user>;

export async function getUserById(id: string) {
  return await db.query.user.findFirst({
    where: eq(user.id, id),
  });
}

export async function getUsers() {
  return await db.query.user.findMany({
    orderBy: [desc(user.createdAt)],
  });
}

// Better Auth owns user creation once PR 1 lands; this exists for the seed and the db-demo page.
export async function createUser(values: UserInsert) {
  const [row] = await db.insert(user).values(values).returning();
  return row;
}
