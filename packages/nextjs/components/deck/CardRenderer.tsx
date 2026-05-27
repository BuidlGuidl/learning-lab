import { CodeCard } from "./cards/CodeCard";
import { ConceptCard } from "./cards/ConceptCard";
import { YourTurnCard } from "./cards/YourTurnCard";
import type { Card } from "~~/lib/deck/types";

type Props = {
  card: Card;
};

export const CardRenderer = ({ card }: Props) => {
  switch (card.type) {
    case "concept":
      return <ConceptCard card={card} />;
    case "your-turn":
      return <YourTurnCard card={card} />;
    case "code":
      return <CodeCard card={card} />;
    case "think":
    case "try-it":
    case "ship-it":
    case "recap":
      return (
        <div className="alert alert-warning max-w-3xl">
          <span>
            Card type <code className="font-mono">{card.type}</code> not implemented in v0.01.
          </span>
        </div>
      );
  }
};
