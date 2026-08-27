import { NextResponse } from "next/server";
import { getLabProgressByUser } from "~~/services/database/repositories/labProgress";

// Throwaway check that the app can reach the database. Remove once real routes exist (PR 2).
export async function GET() {
  const progress = await getLabProgressByUser("seed-user");
  return NextResponse.json({ ok: true, progress });
}
