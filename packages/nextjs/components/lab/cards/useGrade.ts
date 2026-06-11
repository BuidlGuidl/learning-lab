"use client";

import { useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { verdictSchema } from "~~/lib/grader/schema";
import type { GradingEvent } from "~~/lib/grader/transcript";
import { nextAttempt } from "~~/lib/grader/transcript";
import type { RunReport } from "~~/lib/lab/run";
import type { Card } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

// Wraps the streaming grade call for both card types. The verdict rule: when a
// behavioural report exists (code-exercises), compile + tests own the verdict and
// the model only coaches — a model failure still records the event with a fallback
// line, so the gate never blocks on LLM availability. Questions have no report, the
// model owns the verdict there, and an error is not a fail (no event, retry prompt).
export function useGrade(card: Card, chapterId: string) {
  const appendGradingEvent = useLabStore(s => s.appendGradingEvent);

  // onFinish can't see the submission, so stash it to build the event when streaming ends.
  const pending = useRef<{ answer: string; report?: RunReport; attempt: number } | null>(null);

  // toTextStreamResponse carries no error part, so a mid-stream provider failure reaches
  // onFinish with no object and never sets useObject's error. Track it ourselves to recover.
  const [streamFailed, setStreamFailed] = useState(false);

  // The feedback the recorded event settled on. When the stream truncates, the
  // fallback line lives only in the transcript — the live object stays empty —
  // so the card needs this to stop showing loading dots and display something.
  const [settledFeedback, setSettledFeedback] = useState<string | undefined>(undefined);

  const recordEvent = (object?: { verdict?: "pass" | "fail"; feedback?: string; missedConcepts?: string[] }) => {
    const ctx = pending.current;
    if (!ctx) return false;
    const report = ctx.report;
    if (!object?.verdict && !report) return false;

    const fallbackFeedback =
      report?.stage === "compile"
        ? "Your code didn't compile yet. Work through the errors and try again."
        : report?.verdict === "fail"
          ? "Your code compiles but doesn't do what the card asked yet. Check the failed tests and try again."
          : "Your code passed this exercise's tests.";

    const event: GradingEvent = {
      cardId: card.id,
      chapterId,
      attempt: ctx.attempt,
      // report owns the verdict when present; the model only ever decides questions
      outcome: report ? report.verdict : object!.verdict!,
      answer: ctx.answer,
      feedback: object?.feedback ?? fallbackFeedback,
      missedConcepts: object?.missedConcepts?.filter((c): c is string => Boolean(c)) ?? [],
      compilerErrors: report?.stage === "compile" ? report.errors : undefined,
      testResults: report?.stage === "tests" ? report.results : undefined,
      happenedAt: Date.now(),
    };
    appendGradingEvent(event);
    setSettledFeedback(event.feedback);
    pending.current = null;
    return true;
  };

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/grade",
    schema: verdictSchema,
    onFinish: ({ object }) => {
      // model call failed with no report to fall back on -> don't record (errors aren't
      // fails), but flag it so the learner gets a retry prompt instead of a cleared spinner.
      if (!recordEvent(object ?? undefined) && pending.current) setStreamFailed(true);
    },
    // route-level failure (non-ok response). With a report the verdict still stands and
    // must be recorded — the gate can't be hostage to the coach being reachable.
    onError: () => {
      recordEvent();
    },
  });

  const grade = (answer: string, report?: RunReport) => {
    const { currentLabId, transcript } = useLabStore.getState();
    setStreamFailed(false);
    setSettledFeedback(undefined);
    pending.current = { answer, report, attempt: nextAttempt(transcript, card.id) };
    submit({ labId: currentLabId, cardId: card.id, answer, report, transcript });
  };

  // useObject.error covers route-level failures (non-ok response); streamFailed covers the
  // silent mid-stream truncation. Both land on GradeFeedback's "submit again" alert.
  const gradeError = error ?? (streamFailed ? new Error("grader returned no verdict") : undefined);

  return { object, grade, isLoading, error: gradeError, settledFeedback, stop };
}
