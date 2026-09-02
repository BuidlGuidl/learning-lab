import { registry } from "~~/labs/registry";
import { cardsCleared, totalCards } from "~~/lib/lab/position";
import { isLabSnapshot } from "~~/lib/lab/snapshot";
import { getServerSession } from "~~/lib/session";
import { getLabProgress, upsertLabProgress } from "~~/services/database/repositories/labProgress";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ labId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) return new Response("unauthorized", { status: 401 });

  const { labId } = await params;
  if (!registry[labId]) return new Response(`unknown lab: ${labId}`, { status: 404 });

  const row = await getLabProgress(session.user.id, labId);
  if (!row) return new Response("no progress", { status: 404 });

  return Response.json(row);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) return new Response("unauthorized", { status: 401 });

  const { labId } = await params;
  const entry = registry[labId];
  if (!entry) return new Response(`unknown lab: ${labId}`, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("invalid snapshot", { status: 400 });
  }

  if (!isLabSnapshot(body) || body.transcript.labId !== labId) {
    return new Response("invalid snapshot", { status: 400 });
  }

  const { lab } = await entry.load();
  const row = await upsertLabProgress({
    userId: session.user.id,
    labId,
    snapshot: body,
    cardsCleared: cardsCleared(lab, body.transcript),
    totalCards: totalCards(lab),
  });

  return Response.json(row);
}
