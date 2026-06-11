import { create } from "zustand";
import type { GradingEvent, LearningTranscript } from "~~/lib/grader/transcript";
import { isCardCleared, latestEvent, nextAttempt } from "~~/lib/grader/transcript";
import { assembleSources } from "~~/lib/lab/assemble";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";
import type { Region, Segment } from "~~/lib/lab/regions";
import type { Card, Lab } from "~~/lib/lab/types";

type ProgressEntry = {
  learnerInput: string;
  region: string;
};

// A spot in the lab, addressed the way the store already thinks: chapter then card.
export type Position = { chapterIndex: number; cardIndex: number };

// Lab order is lexicographic — later chapter wins, else later card. The sidebar
// uses this against maxReached to decide which cards still read as locked.
export const isPositionAfter = (a: Position, b: Position) =>
  a.chapterIndex > b.chapterIndex || (a.chapterIndex === b.chapterIndex && a.cardIndex > b.cardIndex);

type LabState = {
  currentLabId: string | null;
  chapterIndex: number;
  cardIndex: number;
  // Furthest the learner has legitimately walked via next(). goTo (free-jump) does
  // not move this, so peeking ahead leaves later cards visibly locked. When the
  // mastery gate lands, next() stops here and the locks past it become real.
  maxReached: Position;
  // The lab's derived shape, captured at init: segments per file, regions by id.
  // Sources are never stored — every view renders from these plus fills.
  files: Record<string, Segment[]>;
  regions: Record<string, Region>;
  // the lab's boot + behavioural tests, captured at init for grade-time runs
  deploy: DeployFn | null;
  tests: LabTests | null;
  progress: Record<string, ProgressEntry>;
  transcript: LearningTranscript;
};

type LabActions = {
  init: (lab: Lab) => void;
  next: (lab: Lab) => void;
  prev: (lab: Lab) => void;
  goTo: (chapterIndex: number, cardIndex: number) => void;
  completeCodeExercise: (cardId: string, region: string, learnerInput: string) => void;
  appendGradingEvent: (event: GradingEvent) => void;
  skipCard: (card: Card, chapterId: string) => void;
  reset: () => void;
};

const emptyTranscript: LearningTranscript = { labId: "", events: [] };

const initialState: LabState = {
  currentLabId: null,
  chapterIndex: 0,
  cardIndex: 0,
  maxReached: { chapterIndex: 0, cardIndex: 0 },
  files: {},
  regions: {},
  deploy: null,
  tests: null,
  progress: {},
  transcript: emptyTranscript,
};

// region id -> the learner's accepted text. This is the store's one moving
// part for code; display and grading both render from it.
export const fillsOf = (progress: Record<string, ProgressEntry>): Record<string, string> =>
  Object.fromEntries(Object.values(progress).map(p => [p.region, p.learnerInput]));

// The fills an experiment world assembles with (ADR-0018): the learner's text
// only where the exercise's latest verdict was a pass. progress records every
// submit — including ones that then failed grading — so it can't be used raw;
// failed and unreached regions backfill canonical in assembleSources, and a
// skip already wrote canonical into progress so excluding it changes nothing.
// The verdict must also be about THIS text: progress updates at submit but the
// event lands at stream-finish, so a resubmit-then-jump-ahead on an already-
// cleared card could otherwise ride a stale pass into the experiment.
export const passedFillsOf = (
  progress: Record<string, ProgressEntry>,
  transcript: LearningTranscript,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(progress)
      .filter(([cardId, p]) => {
        const event = latestEvent(transcript, cardId);
        return event?.outcome === "pass" && event.answer === p.learnerInput;
      })
      .map(([, p]) => [p.region, p.learnerInput]),
  );

// The source handed to the compiler when grading one exercise. The learner only
// ever writes one region; placing it and the rest of the file is the platform's
// job. So we isolate the region under test — learner input there, every other
// region canonical-backfilled — and compile that file. A broken or not-yet-written
// neighbour can't fail this answer, which is what stops a correct re-submit from
// tripping over a wrong later card (and lets a region that depends on a later one,
// like the setter emitting an event, still grade). Same bargain SpeedRunEthereum
// makes — every checkpoint ships a reference solution — here that reference also
// backfills the file.
export const gradingSourceOf = (s: LabState, region: string, learnerInput: string) => {
  const file = s.regions[region]?.file;
  if (!file) return "";
  return assembleSources(s.files, s.regions, { [region]: learnerInput })[file];
};

// Gradable cards gate forward nav; read-only types advance freely.
const isGradable = (card: Card) => card.type === "code-exercise" || card.type === "question";

export const useLabStore = create<LabState & LabActions>(set => ({
  ...initialState,
  init: lab =>
    set(s => {
      // Idempotent: re-mounting the same lab (e.g. React strict-mode double-effect)
      // must not wipe in-flight progress. Switching to a different lab restarts.
      if (s.currentLabId === lab.id) return s;
      return {
        ...initialState,
        currentLabId: lab.id,
        files: lab.files,
        regions: lab.regions,
        deploy: lab.deploy,
        tests: lab.tests,
        transcript: { labId: lab.id, events: [] },
      };
    }),
  // Gate-aware forward nav: a gradable card blocks until cleared (pass or skip), prev stays
  // free. A successful sequential advance also bumps the maxReached watermark the sidebar
  // locks against — so the gate stopping here is exactly what keeps later cards locked.
  next: lab =>
    set(s => {
      const chapter = lab.chapters[s.chapterIndex];
      if (!chapter) return s;
      const current = chapter.cards[s.cardIndex];
      if (current && isGradable(current) && !isCardCleared(s.transcript, current.id)) return s;
      let to: Position;
      if (s.cardIndex < chapter.cards.length - 1) to = { chapterIndex: s.chapterIndex, cardIndex: s.cardIndex + 1 };
      else if (s.chapterIndex < lab.chapters.length - 1) to = { chapterIndex: s.chapterIndex + 1, cardIndex: 0 };
      else return s;
      return { ...to, maxReached: isPositionAfter(to, s.maxReached) ? to : s.maxReached };
    }),
  // Free-jump from the sidebar. Moves position only — the watermark stays put, so
  // jumping ahead is a peek, not progress, and those cards keep their lock.
  goTo: (chapterIndex, cardIndex) => set({ chapterIndex, cardIndex }),
  prev: lab =>
    set(s => {
      if (s.cardIndex > 0) return { cardIndex: s.cardIndex - 1 };
      if (s.chapterIndex > 0) {
        const prevChapter = lab.chapters[s.chapterIndex - 1];
        return { chapterIndex: s.chapterIndex - 1, cardIndex: prevChapter.cards.length - 1 };
      }
      return s;
    }),
  // Raw text stays in progress (not a mutated source) so a re-grade can flip a verdict
  // without losing what was typed; re-submitting replaces the region's fill freshly.
  completeCodeExercise: (cardId, region, learnerInput) =>
    set(s => ({ progress: { ...s.progress, [cardId]: { learnerInput, region } } })),
  // Record a grade. The gate reads clearance back out of the transcript, so a pass here is
  // what opens next().
  appendGradingEvent: event => set(s => ({ transcript: { ...s.transcript, events: [...s.transcript.events, event] } })),
  // Dev-only escape hatch. Writes a "skipped" event (captures where learners bail) and fills
  // the region with its canonical — only on a deliberate skip, never a fail — so later reveal
  // cards show real code instead of a placeholder.
  // TODO(remove-skip): drop before this is learner-facing.
  skipCard: (card, chapterId) =>
    set(s => {
      const attempt = nextAttempt(s.transcript, card.id);
      const event: GradingEvent = { cardId: card.id, chapterId, attempt, outcome: "skipped", happenedAt: Date.now() };
      let progress = s.progress;
      if (card.type === "code-exercise") {
        const canonical = s.regions[card.region]?.canonical ?? "";
        progress = { ...s.progress, [card.id]: { learnerInput: canonical, region: card.region } };
      }
      return {
        transcript: { ...s.transcript, events: [...s.transcript.events, event] },
        progress,
      };
    }),
  reset: () => set(initialState),
}));
