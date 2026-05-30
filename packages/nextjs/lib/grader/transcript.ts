// Append-only record of a learner's run through one lab. Two readers: the grader (we
// project a slice into each grade) and, later, per-concept analytics. Held as a store
// buffer for now, shaped like the eventual backend table so hydration is additive.

// verdict is pass|fail;
// TODO: outcome adds "skipped" for the dev escape hatch (no llm call), we'll remove this in future.
export type GradingOutcome = "pass" | "fail" | "skipped";

export type GradingEvent = {
  cardId: string;
  chapterId: string;
  attempt: number; // 1-based; unlimited retries
  outcome: GradingOutcome;
  answer?: string; // absent on a bare skip
  feedback?: string; // absent on a skip
  missedConcepts?: string[]; // absent on a skip
  happenedAt: number;
};

export type LearningTranscript = {
  labId: string;
  events: GradingEvent[];
};

// Gate opens for a card once it has a pass or skip. Derived, not stored as separate state.
export const isCardCleared = (transcript: LearningTranscript, cardId: string): boolean =>
  transcript.events.some(e => e.cardId === cardId && (e.outcome === "pass" || e.outcome === "skipped"));

// Next submission's attempt number; skips don't count as attempts.
export const nextAttempt = (transcript: LearningTranscript, cardId: string): number =>
  transcript.events.filter(e => e.cardId === cardId && e.outcome !== "skipped").length + 1;

// Latest event for a card — what a card re-renders when the learner navigates back to it.
export const latestEvent = (transcript: LearningTranscript, cardId: string): GradingEvent | undefined => {
  for (let i = transcript.events.length - 1; i >= 0; i--) {
    if (transcript.events[i].cardId === cardId) return transcript.events[i];
  }
  return undefined;
};
