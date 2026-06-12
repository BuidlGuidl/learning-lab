import { CardFrame } from "../CardFrame";
import type { SummaryCard as SummaryCardType } from "~~/lib/lab/types";

type Props = {
  card: SummaryCardType;
};

export const SummaryCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap">{card.body}</p>
    </CardFrame>
  );
};
