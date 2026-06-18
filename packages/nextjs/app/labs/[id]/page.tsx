import { notFound } from "next/navigation";
import { LabLoader } from "./LabLoader";
import { registry } from "~~/labs/registry";

type Props = {
  params: Promise<{ id: string }>;
};

const LabPage = async ({ params }: Props) => {
  const { id } = await params;
  if (!registry[id]) notFound();
  return <LabLoader id={id} />;
};

export default LabPage;
