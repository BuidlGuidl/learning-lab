import type { InferSelectModel } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";
import { db } from "~~/services/database/config/postgresClient";
import { user } from "~~/services/database/config/schema";

export type User = InferSelectModel<typeof user>;

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
