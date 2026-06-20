"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { GradeFeedback } from "./GradeFeedback";
import { useGrade } from "./useGrade";
import { LightBulbIcon } from "@heroicons/react/24/outline";
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
  // How many rungs of the hint ladder are turned over. Transient on purpose — cheap to
  // re-reveal, and hints aren't progress worth persisting (same call as the code exercise).
  const [revealedHints, setRevealedHints] = useState(0);

  const { object, grade, isLoading, error } = useGrade(card, chapterId);

  const hints = card.hints ?? [];
  const moreHints = revealedHints < hints.length;

  const verdict: GradingOutcome | undefined = isLoading ? object?.verdict : latest?.outcome;
  const feedback = isLoading ? object?.feedback : latest?.feedback;
  const missed = (isLoading ? object?.missedConcepts : latest?.missedConcepts)?.filter((c): c is string => Boolean(c));

  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text mb-4">{card.question}</Markdown>
      <textarea
        className="textarea textarea-bordered text-sm w-full leading-relaxed"
        rows={5}
        placeholder="Explain in your own words…"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={isLoading}
      />
      <div className="card-actions justify-end mt-4">
        <button
          className="btn btn-primary"
          onClick={() => grade(input)}
          disabled={isLoading || input.trim().length === 0}
        >
          {isLoading ? "Grading…" : latest ? "Re-submit" : "Submit"}
        </button>
      </div>

      {/* The free, offline hint ladder — same amber affordance as a code exercise. Hidden until
          asked so it doesn't pre-empt the learner's own attempt; reveals one rung at a time. */}
      {hints.length > 0 && (
        <div className="mt-4">
          <button
            className="btn btn-ghost btn-sm gap-1.5 font-mono text-xs normal-case text-warning hover:bg-warning/10 disabled:text-base-content/30"
            onClick={() => setRevealedHints(n => Math.min(n + 1, hints.length))}
            disabled={!moreHints || isLoading}
          >
            <LightBulbIcon className="h-3.5 w-3.5" />
            {revealedHints === 0
              ? "need a hint?"
              : moreHints
                ? `next hint · ${revealedHints + 1}/${hints.length}`
                : "no more hints"}
          </button>
        </div>
      )}

      {revealedHints > 0 && (
        <ul className="mt-3 space-y-2.5 rounded-box border-l-2 border-warning/50 bg-base-200/30 px-4 py-3">
          {hints.slice(0, revealedHints).map((hint, i) => (
            <li key={i} className="flex items-baseline gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-warning/70">{i + 1}</span>
              <span className="m-0 text-sm leading-relaxed text-base-content/80">
                <Markdown inline>{hint}</Markdown>
              </span>
            </li>
          ))}
        </ul>
      )}

      <GradeFeedback pending={isLoading} error={error} verdict={verdict} feedback={feedback} missedConcepts={missed} />
    </CardFrame>
  );
};
