"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { GradeFeedback } from "./GradeFeedback";
import { useGrade } from "./useGrade";
import { latestEvent } from "~~/lib/grader/transcript";
import type { GradingOutcome } from "~~/lib/grader/transcript";
import type { QuestionCard as QuestionCardType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: QuestionCardType;
  chapterId: string;
};

// No compiler for prose, so the model owns the verdict here.
export const QuestionCard = ({ card, chapterId }: Props) => {
  const latest = useLabStore(s => latestEvent(s.transcript, card.id));
  const [input, setInput] = useState(latest?.answer ?? "");

  const { object, grade, isLoading, error } = useGrade(card, chapterId);

  const verdict: GradingOutcome | undefined = isLoading ? object?.verdict : latest?.outcome;
  const feedback = isLoading ? object?.feedback : latest?.feedback;
  const missed = (isLoading ? object?.missedConcepts : latest?.missedConcepts)?.filter((c): c is string => Boolean(c));

  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text mb-4">{card.question}</Markdown>
      {card.hint && (
        <div className="text-sm text-base-content/60 mb-3">
          <span className="font-semibold">Hint:</span> <Markdown inline>{card.hint}</Markdown>
        </div>
      )}
      <textarea
        className="textarea textarea-bordered text-sm w-full leading-relaxed"
        rows={5}
        placeholder="Explain in your own words…"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={isLoading}
      />
      <div className="card-actions justify-end mt-3">
        <button
          className="btn btn-primary"
          onClick={() => grade(input)}
          disabled={isLoading || input.trim().length === 0}
        >
          {isLoading ? "Grading…" : latest ? "Re-submit" : "Submit"}
        </button>
      </div>
      <GradeFeedback pending={isLoading} error={error} verdict={verdict} feedback={feedback} missedConcepts={missed} />
    </CardFrame>
  );
};
