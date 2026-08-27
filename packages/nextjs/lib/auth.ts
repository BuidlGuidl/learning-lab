import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { db } from "~~/services/database/config/postgresClient";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
});
