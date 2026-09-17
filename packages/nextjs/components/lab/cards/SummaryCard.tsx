import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import type { SummaryCard as SummaryCardType } from "~~/lib/lab/types";

type Props = {
  card: SummaryCardType;
};

export const SummaryCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text">{card.body}</Markdown>

      {(card.illustrations ?? []).map((Illustration, index) => (
        <div key={index} className="mt-7">
          <Illustration />
        </div>
      ))}
    </CardFrame>
  );
};
