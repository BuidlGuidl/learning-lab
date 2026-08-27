import * as schema from "./schema";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type DbInstance = ReturnType<typeof drizzleNode<typeof schema>> | ReturnType<typeof drizzleNeon<typeof schema>>;

let dbInstance: DbInstance | null = null;
let poolInstance: Pool | NeonPool | null = null;

export function getDb(): DbInstance {
  if (dbInstance) return dbInstance;

  if (process.env.DATABASE_URL?.includes("neon")) {
    poolInstance = new NeonPool({ connectionString: process.env.DATABASE_URL });
    dbInstance = drizzleNeon(poolInstance, { schema, casing: "snake_case" });
  } else {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    poolInstance = pool;
    dbInstance = drizzleNode(pool, { schema, casing: "snake_case" });

    // pg discards the broken client; exiting here would take the whole server down with it.
    pool.on("error", error => console.error("Unexpected error on idle database client", error));
  }

  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (!poolInstance) return;

  await poolInstance.end();
  poolInstance = null;
  dbInstance = null;
}

type DbProxy = DbInstance & { close: () => Promise<void> };

const dbProxy = new Proxy(
  {},
  {
    get: (_, prop: keyof DbProxy) => {
      if (prop === "close") return closeDb;

      const database = getDb();
      return database[prop];
    },
    has: (_, prop: keyof DbProxy) => prop in getDb(),
  },
);

export const db = dbProxy as DbProxy;
