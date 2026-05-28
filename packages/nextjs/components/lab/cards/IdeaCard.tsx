import { CardFrame } from "../CardFrame";
import type { IdeaCard as IdeaCardType } from "~~/lib/lab/types";

type Props = {
  card: IdeaCardType;
};

export const IdeaCard = ({ card }: Props) => {
  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap">{card.body}</p>
    </CardFrame>
  );
};
