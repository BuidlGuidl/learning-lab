import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import type { ConceptCard as ConceptCardType } from "~~/lib/lab/types";

type Props = {
  card: ConceptCardType;
};

export const ConceptCard = ({ card }: Props) => {
  // Illustrations live inline, below the prose — each a static image stacked in
  // order (see Illustration / illustrations).
  const illustrations = card.illustrations ?? [];

  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text">{card.body}</Markdown>

      {illustrations.map((Illustration, index) => (
        <div key={index} className="mt-7">
          <Illustration />
        </div>
      ))}
    </CardFrame>
  );
};
