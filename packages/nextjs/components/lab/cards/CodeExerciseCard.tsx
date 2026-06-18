"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { GradeFeedback } from "./GradeFeedback";
import { TestRunPanel } from "./TestRunPanel";
import { useGrade } from "./useGrade";
import { LightBulbIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CodeInput } from "~~/components/code/CodeInput";
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
  const recordRunVerdict = useLabStore(s => s.recordRunVerdict);
  const saved = useLabStore(s => s.progress[card.id]?.learnerInput ?? "");
  const latest = useLabStore(s => latestEvent(s.transcript, card.id));
  const regionTests = useLabStore(s => s.tests?.[card.region]);
  const [input, setInput] = useState(saved);
  // The behavioural run's result. The verdict chip reads this the moment the tests finish.
  const [report, setReport] = useState<RunReport | null>(null);
  // Live narration of the run (fetching compiler → compiling → testing). On a cold page the
  // first submit sits behind a ~7MB soljson download, and a silent button reads as broken.
  const [progress, setProgress] = useState<RunProgress | null>(null);
  // How many rungs of the free hint ladder the learner has turned over. Transient on purpose
  // — cheap to re-reveal, and hints aren't progress worth persisting.
  const [revealedHints, setRevealedHints] = useState(0);
  const running = progress !== null;

  const hints = card.hints ?? [];
  const moreHints = revealedHints < hints.length;

  // The coach. Opt-in only (the "ask the coach" button) — never auto-fired on submit, so a
  // pass with no questions never touches the model. It can't write the transcript: the gate
  // already cleared on the test verdict, and the coach's words live only in this hook.
  const { object, grade, isLoading, error, settledFeedback } = useGrade(card, chapterId);

  const handleSubmit = async () => {
    // Record the input for the display path (reveal cards), then run the real thing: assemble
    // this region against canonicals, compile in the worker, deploy in tevm, run the region's
    // tests. That run IS the verdict, and it writes the gating event itself — no llm in the loop.
    completeCodeExercise(card.id, card.region, input);
    setReport(null);
    setProgress({ step: "compiling" });
    try {
      const result = await gradeRegion(card.region, input, setProgress);
      setReport(result);
      recordRunVerdict(card.id, chapterId, input, result);
    } finally {
      setProgress(null);
    }
  };

  // The report owns the verdict from the moment it exists; idle shows the last recorded event.
  const settled = report ? report.verdict : running ? undefined : latest?.outcome;
  const runVerdict = settled === "pass" || settled === "fail" ? settled : undefined;
  // The verdict + its raw output (compile errors, test rows) are recorded on the event, so a
  // navigate-back re-renders them; coach feedback is not — it's transient, from the hook alone.
  const compilerErrors = report?.stage === "compile" ? report.errors : report ? undefined : latest?.compilerErrors;
  const testResults = report?.stage === "tests" ? report.results : report ? undefined : latest?.testResults;
  const coachFeedback = object?.feedback ?? settledFeedback;
  const coachMissed = object?.missedConcepts?.filter((c): c is string => Boolean(c));
  // Why the coach is locked, if it is. Shown as a tooltip so the button is always visible
  // (the learner discovers the option) but spells out the two gates: spend the free hints,
  // then run the test — the coach only ever speaks to a real verdict.
  const coachTip = moreHints ? "Check the hints first" : !report ? "Run the test first" : undefined;

  return (
    <CardFrame card={card}>
      <Markdown className="text-base-content/90 leading-relaxed mb-4">{card.prompt}</Markdown>
      <CodeInput value={input} onChange={setInput} placeholder={card.placeholder} readOnly={running || isLoading} />
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
                : latest
                  ? "Re-submit"
                  : "Submit"}
        </button>
      </div>
      <TestRunPanel
        testNames={regionTests?.map(t => t.name) ?? []}
        progress={progress}
        verdict={runVerdict}
        results={testResults}
        compilerErrors={compilerErrors}
      />

      {/* Two-tier help, both visible from the start so the coach is discoverable. Amber = the
          free, offline hint ladder; teal = the paid AI escalation. The coach is disabled — with
          a tooltip naming the gate — until every hint is spent AND a test run exists, so the
          model never speaks without a real verdict behind it. The hint button retires to a
          dimmed "no more hints" once the ladder's done. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {hints.length > 0 && (
          <button
            className="btn btn-ghost btn-sm gap-1.5 font-mono text-xs normal-case text-warning hover:bg-warning/10 disabled:text-base-content/30"
            onClick={() => setRevealedHints(n => Math.min(n + 1, hints.length))}
            disabled={!moreHints || running}
          >
            <LightBulbIcon className="h-3.5 w-3.5" />
            {revealedHints === 0
              ? "need a hint?"
              : moreHints
                ? `next hint · ${revealedHints + 1}/${hints.length}`
                : "no more hints"}
          </button>
        )}
        <div className={coachTip ? "tooltip" : undefined} data-tip={coachTip}>
          <button
            className="btn btn-sm btn-accent gap-1.5 font-mono text-xs normal-case"
            onClick={() => grade(input, report ?? undefined)}
            disabled={running || isLoading || moreHints || !report}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            {isLoading ? "asking…" : "ask the coach"}
          </button>
        </div>
      </div>

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

      <GradeFeedback
        variant="coach"
        pending={isLoading && !coachFeedback}
        error={error}
        feedback={coachFeedback}
        missedConcepts={coachMissed}
      />
    </CardFrame>
  );
};
