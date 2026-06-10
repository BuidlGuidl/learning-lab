"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { GradeFeedback } from "./GradeFeedback";
import { useGrade } from "./useGrade";
import { latestEvent } from "~~/lib/grader/transcript";
import type { GradingOutcome } from "~~/lib/grader/transcript";
import { gradeRegion } from "~~/lib/lab/grade";
import type { RunReport } from "~~/lib/lab/run";
import type { CodeExerciseCard as CodeExerciseCardType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeExerciseCardType;
  chapterId: string;
};

export const CodeExerciseCard = ({ card, chapterId }: Props) => {
  const completeCodeExercise = useLabStore(s => s.completeCodeExercise);
  const saved = useLabStore(s => s.progress[card.id]?.learnerInput ?? "");
  const latest = useLabStore(s => latestEvent(s.transcript, card.id));
  const [input, setInput] = useState(saved);
  // The behavioural run's result. The verdict chip reads this the moment the
  // tests finish — coaching streams in after, but never decides anything.
  const [report, setReport] = useState<RunReport | null>(null);
  const [running, setRunning] = useState(false);

  const { object, grade, isLoading, error } = useGrade(card, chapterId);

  const handleSubmit = async () => {
    // Record the input for the display path (reveal cards), then run the real
    // thing: assemble this region against canonicals, compile in the worker,
    // deploy in tevm, run the region's tests. That run IS the verdict.
    completeCodeExercise(card.id, card.region, input);
    setRunning(true);
    setReport(null);
    try {
      const result = await gradeRegion(card.region, input);
      setReport(result);
      grade(input, result);
    } finally {
      setRunning(false);
    }
  };

  // The report owns the verdict from the moment it exists; idle shows the last recorded event.
  const verdict: GradingOutcome | undefined = report ? report.verdict : isLoading ? undefined : latest?.outcome;
  const feedback = isLoading || report ? object?.feedback : latest?.feedback;
  const missed = (isLoading ? object?.missedConcepts : latest?.missedConcepts)?.filter((c): c is string => Boolean(c));
  const compilerErrors =
    report?.stage === "compile" ? report.errors : isLoading || report ? undefined : latest?.compilerErrors;
  const testResults = report?.stage === "tests" ? report.results : isLoading ? undefined : latest?.testResults;

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.prompt}</p>
      <textarea
        className="textarea textarea-bordered font-mono text-sm w-full"
        rows={3}
        placeholder={card.placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={running || isLoading}
      />
      <div className="card-actions justify-end mt-3">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={running || isLoading || input.trim().length === 0}
        >
          {running ? "Running tests…" : isLoading ? "Grading…" : latest ? "Re-submit" : "Submit"}
        </button>
      </div>
      <GradeFeedback
        pending={running || isLoading}
        error={error}
        verdict={verdict}
        feedback={feedback}
        missedConcepts={missed}
        compilerErrors={compilerErrors}
        testResults={testResults}
      />
    </CardFrame>
  );
};
