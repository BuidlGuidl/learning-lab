import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import type { ConceptCard as ConceptCardType } from "~~/lib/lab/types";

type Props = {
  card: ConceptCardType;
};

export const ConceptCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text">{card.body}</Markdown>
    </CardFrame>
  );
};
