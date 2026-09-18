import { notFound } from "next/navigation";
import { LabLoader } from "./LabLoader";
import { registry } from "~~/labs/registry";
import { getServerSession } from "~~/lib/session";
import { getLabProgress } from "~~/services/database/repositories/labProgress";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const LabPage = async ({ params }: Props) => {
  const { id } = await params;
  if (!registry[id]) notFound();
  const session = await getServerSession();
  const row = session ? await getLabProgress(session.user.id, id) : null;
  return <LabLoader id={id} initialSnapshot={row?.snapshot ?? null} />;
};

export default LabPage;
