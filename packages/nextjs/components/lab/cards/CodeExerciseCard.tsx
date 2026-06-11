"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { GradeFeedback } from "./GradeFeedback";
import { TestRunPanel } from "./TestRunPanel";
import { useGrade } from "./useGrade";
import { latestEvent } from "~~/lib/grader/transcript";
import { gradeRegion } from "~~/lib/lab/grade";
import type { RunProgress, RunReport } from "~~/lib/lab/run";
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
  // Live narration of the run (fetching compiler → compiling → testing). On a
  // cold page the first submit sits behind a ~7MB soljson download, and a
  // silent button for those seconds reads as broken.
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const running = progress !== null;

  const { object, grade, isLoading, error } = useGrade(card, chapterId);

  const handleSubmit = async () => {
    // Record the input for the display path (reveal cards), then run the real
    // thing: assemble this region against canonicals, compile in the worker,
    // deploy in tevm, run the region's tests. That run IS the verdict.
    completeCodeExercise(card.id, card.region, input);
    setReport(null);
    setProgress({ step: "compiling" });
    try {
      const result = await gradeRegion(card.region, input, setProgress);
      setReport(result);
      grade(input, result);
    } finally {
      setProgress(null);
    }
  };

  // The report owns the verdict from the moment it exists; idle shows the last recorded event.
  const settled = report ? report.verdict : running || isLoading ? undefined : latest?.outcome;
  const runVerdict = settled === "pass" || settled === "fail" ? settled : undefined;
  const feedback = isLoading || report ? object?.feedback : latest?.feedback;
  const missed = (isLoading ? object?.missedConcepts : latest?.missedConcepts)?.filter((c): c is string => Boolean(c));
  const compilerErrors =
    report?.stage === "compile" ? report.errors : isLoading || report ? undefined : latest?.compilerErrors;
  const testResults =
    report?.stage === "tests" ? report.results : isLoading || report ? undefined : latest?.testResults;

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
          {progress?.step === "fetching-compiler"
            ? "Fetching compiler…"
            : progress?.step === "compiling"
              ? "Compiling…"
              : progress?.step === "testing"
                ? "Running tests…"
                : isLoading
                  ? "Grading…"
                  : latest
                    ? "Re-submit"
                    : "Submit"}
        </button>
      </div>
      <TestRunPanel progress={progress} verdict={runVerdict} results={testResults} compilerErrors={compilerErrors} />
      <GradeFeedback
        variant="coach"
        pending={isLoading || (report !== null && !feedback)}
        error={error}
        feedback={feedback}
        missedConcepts={missed}
      />
    </CardFrame>
  );
};
