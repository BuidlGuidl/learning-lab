import { notFound } from "next/navigation";
import { Deck } from "~~/components/deck/Deck";
import { registry } from "~~/decks/registry";

type Props = {
  params: Promise<{ id: string }>;
};

const DeckPage = async ({ params }: Props) => {
  const { id } = await params;
  const entry = registry[id];
  if (!entry) notFound();
  const { deck } = await entry.load();
  return <Deck deck={deck} />;
};

export default DeckPage;
