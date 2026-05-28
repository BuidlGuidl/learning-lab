import { notFound } from "next/navigation";
import { Lab } from "~~/components/lab/Lab";
import { registry } from "~~/labs/registry";

type Props = {
  params: Promise<{ id: string }>;
};

const LabPage = async ({ params }: Props) => {
  const { id } = await params;
  const entry = registry[id];
  if (!entry) notFound();
  const { lab } = await entry.load();
  return <Lab lab={lab} />;
};

export default LabPage;
