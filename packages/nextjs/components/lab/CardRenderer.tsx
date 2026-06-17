import { CodeCard } from "./cards/CodeCard";
import { CodeExerciseCard } from "./cards/CodeExerciseCard";
import { ConceptCard } from "./cards/ConceptCard";
import { ExperimentCard } from "./cards/ExperimentCard";
import { QuestionCard } from "./cards/QuestionCard";
import { SummaryCard } from "./cards/SummaryCard";
import type { Card, Lab } from "~~/lib/lab/types";

type Props = {
  card: Card;
  chapterId: string;
  // the experiment card scopes its checks to the cards before it, which only
  // the lab's chapter order knows
  lab: Lab;
};

export const CardRenderer = ({ card, chapterId, lab }: Props) => {
  switch (card.type) {
    case "concept":
      return <ConceptCard card={card} />;
    case "code-exercise":
      return <CodeExerciseCard card={card} chapterId={chapterId} />;
    case "code":
      return <CodeCard card={card} />;
    case "question":
      return <QuestionCard card={card} chapterId={chapterId} />;
    case "experiment":
      return <ExperimentCard card={card} lab={lab} />;
    case "summary":
      return <SummaryCard card={card} />;
    default:
      // statically unreachable — the catch keeps an unknown/legacy type from
      // vanishing silently instead of surfacing as a visible gap
      card satisfies never;
      return (
        <div className="alert alert-warning text-sm">
          unknown card type <code className="font-mono">{(card as { type: string }).type}</code>
        </div>
      );
  }
};
