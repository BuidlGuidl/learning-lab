import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import type { SummaryCard as SummaryCardType } from "~~/lib/lab/types";

type Props = {
  card: SummaryCardType;
};

export const SummaryCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <Markdown className="text-base-content/90 leading-relaxed">{card.body}</Markdown>
    </CardFrame>
  );
};
