import { CardFrame } from "../CardFrame";
import type { ConceptCard as ConceptCardType } from "~~/lib/deck/types";

type Props = {
  card: ConceptCardType;
};

export const ConceptCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap">{card.body}</p>
    </CardFrame>
  );
};
