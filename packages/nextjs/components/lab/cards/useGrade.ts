"use client";

import { useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { CompileCheckResult } from "~~/lib/grader/compile-check";
import { verdictSchema } from "~~/lib/grader/schema";
import type { GradingEvent } from "~~/lib/grader/transcript";
import { nextAttempt } from "~~/lib/grader/transcript";
import type { Card } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

// Wraps the streaming grade call for both card types. Two rules the client enforces: the
// compiler owns the code verdict (force "fail" when compile failed, ignore the model), and
// errors are not fails (no object + not a compile-fail -> don't record, gate stays locked) —
// but they're surfaced as a retry prompt, not swallowed into a vanishing spinner.
export function useGrade(card: Card, chapterId: string) {
  const appendGradingEvent = useLabStore(s => s.appendGradingEvent);

  // onFinish can't see the submission, so stash it to build the event when streaming ends.
  const pending = useRef<{ answer: string; compileResult?: CompileCheckResult; attempt: number } | null>(null);

  // toTextStreamResponse carries no error part, so a mid-stream provider failure reaches
  // onFinish with no object and never sets useObject's error. Track it ourselves to recover.
  const [streamFailed, setStreamFailed] = useState(false);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/grade",
    schema: verdictSchema,
    onFinish: ({ object }) => {
      const ctx = pending.current;
      if (!ctx) return;
      const compiledFail = !!ctx.compileResult && !ctx.compileResult.ok;
      // model call failed and it's not a compile-fail -> don't record (errors aren't fails),
      // but flag it so the learner gets a retry prompt instead of a silently cleared spinner.
      if (!object && !compiledFail) {
        setStreamFailed(true);
        return;
      }

      const verdict = compiledFail ? "fail" : object!.verdict;
      const compilerErrors = ctx.compileResult && !ctx.compileResult.ok ? ctx.compileResult.errors : undefined;
      const event: GradingEvent = {
        cardId: card.id,
        chapterId,
        attempt: ctx.attempt,
        outcome: verdict,
        answer: ctx.answer,
        feedback: object?.feedback ?? "Your code didn't compile yet. Work through the errors and try again.",
        missedConcepts: object?.missedConcepts ?? [],
        compilerErrors,
        happenedAt: Date.now(),
      };
      appendGradingEvent(event);
      pending.current = null;
    },
  });

  const grade = (answer: string, compileResult?: CompileCheckResult) => {
    const { currentLabId, transcript } = useLabStore.getState();
    setStreamFailed(false);
    pending.current = { answer, compileResult, attempt: nextAttempt(transcript, card.id) };
    submit({ labId: currentLabId, cardId: card.id, answer, compileResult, transcript });
  };

  // useObject.error covers route-level failures (non-ok response); streamFailed covers the
  // silent mid-stream truncation. Both land on GradeFeedback's "submit again" alert.
  const gradeError = error ?? (streamFailed ? new Error("grader returned no verdict") : undefined);

  return { object, grade, isLoading, error: gradeError, stop };
}
