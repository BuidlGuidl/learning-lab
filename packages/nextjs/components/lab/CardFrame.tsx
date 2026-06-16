import type { Card } from "~~/lib/lab/types";

type Props = {
  card: Card;
  children: React.ReactNode;
};

const DROP_CAP_MIN_CHARS = 140;

const getDropCapText = (card: Card) => {
  switch (card.type) {
    case "concept":
    case "summary":
      return card.body;
    case "code":
      return card.note ?? "";
    default:
      return "";
  }
};

export const CardFrame = ({ card, children }: Props) => {
  const showDropCap = getDropCapText(card).trim().length >= DROP_CAP_MIN_CHARS;

  return (
    <div className={`lab-card w-full max-w-3xl ${showDropCap ? "lab-card--dropcap" : ""}`}>
      <div className="lab-card__body">
        <span className="lab-card__eyebrow font-mono uppercase text-xs self-start">{card.label}</span>
        <h2 className="lab-card__title">{card.title}</h2>
        {children}
      </div>
    </div>
  );
};
