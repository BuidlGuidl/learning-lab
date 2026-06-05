"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { GradeFeedback } from "./GradeFeedback";
import { useGrade } from "./useGrade";
import { compileCheck } from "~~/lib/grader/compile-check";
import type { CompileCheckResult } from "~~/lib/grader/compile-check";
import { latestEvent } from "~~/lib/grader/transcript";
import type { GradingOutcome } from "~~/lib/grader/transcript";
import type { CodeExerciseCard as CodeExerciseCardType } from "~~/lib/lab/types";
import { gradingSourceOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeExerciseCardType;
  chapterId: string;
};

export const CodeExerciseCard = ({ card, chapterId }: Props) => {
  const completeCodeExercise = useLabStore(s => s.completeCodeExercise);
  const saved = useLabStore(s => s.progress[card.id]?.learnerInput ?? "");
  const latest = useLabStore(s => latestEvent(s.transcript, card.id));
  const [input, setInput] = useState(saved);
  // Lets the chip read "fail" the instant compilation fails, before coaching streams in.
  const [lastCompile, setLastCompile] = useState<CompileCheckResult | null>(null);

  const { object, grade, isLoading, error } = useGrade(card, chapterId);

  const handleSubmit = async () => {
    // Record the input for the display path (peek + reveal cards), then compile an
    // isolated file for grading: only this slot under test, every other slot backfilled
    // with its canonical so a broken neighbour can't fail a correct answer.
    completeCodeExercise(card.id, card.file, card.slot, input);
    const assembled = gradingSourceOf(useLabStore.getState(), card.file, card.slot, input);
    const compileResult = await compileCheck(assembled);
    setLastCompile(compileResult);
    grade(input, compileResult);
  };

  // grading: compile-fail pins "fail", else the streamed verdict. idle: last recorded result.
  const verdict: GradingOutcome | undefined = isLoading
    ? lastCompile && !lastCompile.ok
      ? "fail"
      : object?.verdict
    : latest?.outcome;
  const feedback = isLoading ? object?.feedback : latest?.feedback;
  const missed = (isLoading ? object?.missedConcepts : latest?.missedConcepts)?.filter((c): c is string => Boolean(c));
  const compilerErrors = isLoading
    ? lastCompile && !lastCompile.ok
      ? lastCompile.errors
      : undefined
    : latest?.compilerErrors;

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.prompt}</p>
      <textarea
        className="textarea textarea-bordered font-mono text-sm w-full"
        rows={3}
        placeholder={card.placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={isLoading}
      />
      <div className="card-actions justify-end mt-3">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading || input.trim().length === 0}>
          {isLoading ? "Grading…" : latest ? "Re-submit" : "Submit"}
        </button>
      </div>
      <GradeFeedback
        pending={isLoading}
        error={error}
        verdict={verdict}
        feedback={feedback}
        missedConcepts={missed}
        compilerErrors={compilerErrors}
      />
    </CardFrame>
  );
};
