import { CodeCard } from "./cards/CodeCard";
import { CodeExerciseCard } from "./cards/CodeExerciseCard";
import { ConceptCard } from "./cards/ConceptCard";
import type { Card } from "~~/lib/lab/types";

type Props = {
  card: Card;
};

export const CardRenderer = ({ card }: Props) => {
  switch (card.type) {
    case "concept":
      return <ConceptCard card={card} />;
    case "code-exercise":
      return <CodeExerciseCard card={card} />;
    case "code":
      return <CodeCard card={card} />;
    case "question":
    case "experiment":
    case "deployment":
    case "summary":
      return (
        <div className="alert alert-warning max-w-3xl">
          <span>
            Card type <code className="font-mono">{card.type}</code> not implemented in v0.01.
          </span>
        </div>
      );
  }
};
