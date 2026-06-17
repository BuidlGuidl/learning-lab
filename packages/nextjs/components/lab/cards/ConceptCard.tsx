import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import type { ConceptCard as ConceptCardType } from "~~/lib/lab/types";

type Props = {
  card: ConceptCardType;
};

export const ConceptCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <Markdown className="text-base-content/90 leading-relaxed">{card.body}</Markdown>
    </CardFrame>
  );
};
