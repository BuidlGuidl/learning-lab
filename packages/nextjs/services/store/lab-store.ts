import { create } from "zustand";
// type-only — no runtime dependency on these modules
import type { ConsoleEntry } from "~~/components/lab/cards/Console";
import type { GradingEvent, LearningTranscript } from "~~/lib/grader/transcript";
import { isCardCleared, nextAttempt } from "~~/lib/grader/transcript";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";
import type { ExperimentBoot } from "~~/lib/lab/learner-world";
import type { Region, Segment } from "~~/lib/lab/regions";
import type { RunProgress, RunReport } from "~~/lib/lab/run";
import type { Card, Lab } from "~~/lib/lab/types";

type ProgressEntry = {
  learnerInput: string;
  region: string;
};

// One experiment's deployed world and the state its card renders: the boot
// result, in-flight deploy progress, the console log, and a revealed flag for
// the receipt animation. Keyed by world id so it persists while the learner
// navigates between cards.
export type WorldState = {
  boot: ExperimentBoot | null;
  progress: RunProgress | null;
  crash: string | null;
  log: ConsoleEntry[];
  epoch: number;
  revealed: boolean; // false only while a fresh deploy receipt is mid-reveal
};

const newWorld = (): WorldState => ({
  boot: null,
  progress: null,
  crash: null,
  log: [],
  epoch: 0,
  revealed: true,
});

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
  // every experiment's world, keyed by world id. Deploying writes here and the
  // card reads it back, so a deployed world survives navigation. Holds an
  // in-memory chain, so it's dropped on lab switch.
  worlds: Record<string, WorldState>;
};

type LabActions = {
  init: (lab: Lab) => void;
  next: (lab: Lab) => void;
  prev: (lab: Lab) => void;
  goTo: (chapterIndex: number, cardIndex: number) => void;
  completeCodeExercise: (cardId: string, region: string, learnerInput: string) => void;
  recordRunVerdict: (cardId: string, chapterId: string, learnerInput: string, report: RunReport) => void;
  appendGradingEvent: (event: GradingEvent) => void;
  skipCard: (card: Card, chapterId: string) => void;
  startDeploy: (worldId: string) => void;
  setDeployProgress: (worldId: string, progress: RunProgress) => void;
  finishDeploy: (worldId: string, boot: ExperimentBoot) => void;
  failDeploy: (worldId: string, crash: string) => void;
  markRevealed: (worldId: string) => void;
  appendConsoleEntry: (worldId: string, entry: ConsoleEntry) => void;
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
  worlds: {},
};

// region id -> the learner's latest submitted text (a skip writes the
// canonical). This is the store's one moving part for code; display,
// grading, and the experiment world all render from it — the experiment on
// purpose: the learner deploys what they actually wrote, passing or not,
// and a broken fill surfaces as a real compile error, never a silent
// canonical stand-in.
export const fillsOf = (progress: Record<string, ProgressEntry>): Record<string, string> =>
  Object.fromEntries(Object.values(progress).map(p => [p.region, p.learnerInput]));

// Every region rendered as its finished canonical source — the "reveal" view a
// read-only card uses to show completed code before the learner has written it.
export const canonicalFills = (regions: Record<string, Region>): Record<string, string> =>
  Object.fromEntries(Object.entries(regions).map(([id, r]) => [id, r.canonical]));

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
  // The test run owns the gate. Submitting a code-exercise records its verdict straight off
  // the report, so isCardCleared flips on the tests alone — Next never waits on the llm, and
  // the coach (opt-in, separate) can't write here. Feedback stays off the event on purpose:
  // it's transient coach output now, not part of the transcript.
  recordRunVerdict: (cardId, chapterId, learnerInput, report) =>
    set(s => {
      const event: GradingEvent = {
        cardId,
        chapterId,
        attempt: nextAttempt(s.transcript, cardId),
        outcome: report.verdict,
        answer: learnerInput,
        compilerErrors: report.stage === "compile" ? report.errors : undefined,
        testResults: report.stage === "tests" ? report.results : undefined,
        happenedAt: Date.now(),
      };
      return { transcript: { ...s.transcript, events: [...s.transcript.events, event] } };
    }),
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
  // Deploy lifecycle for one world: startDeploy clears the last result and goes
  // live; setDeployProgress narrates the checks; finishDeploy lands the boot and
  // arms a fresh receipt reveal; failDeploy records an unexpected throw.
  startDeploy: worldId =>
    set(s => ({
      worlds: {
        ...s.worlds,
        [worldId]: {
          ...(s.worlds[worldId] ?? newWorld()),
          boot: null,
          crash: null,
          log: [],
          progress: { step: "compiling" },
        },
      },
    })),
  setDeployProgress: (worldId, progress) =>
    set(s => {
      const world = s.worlds[worldId];
      if (!world) return s;
      return { worlds: { ...s.worlds, [worldId]: { ...world, progress } } };
    }),
  finishDeploy: (worldId, boot) =>
    set(s => {
      const world = s.worlds[worldId] ?? newWorld();
      return {
        worlds: {
          ...s.worlds,
          [worldId]: { ...world, boot, progress: null, crash: null, log: [], epoch: world.epoch + 1, revealed: false },
        },
      };
    }),
  failDeploy: (worldId, crash) =>
    set(s => {
      const world = s.worlds[worldId] ?? newWorld();
      return { worlds: { ...s.worlds, [worldId]: { ...world, crash, progress: null } } };
    }),
  // the console flips this once the receipt finishes typing, so navigating back
  // to a deployed card shows it static instead of re-animating.
  markRevealed: worldId =>
    set(s => {
      const world = s.worlds[worldId];
      if (!world || world.revealed) return s;
      return { worlds: { ...s.worlds, [worldId]: { ...world, revealed: true } } };
    }),
  // a surface read/write appends here, so the console shows the deploy receipt
  // and the surface's activity in one log.
  appendConsoleEntry: (worldId, entry) =>
    set(s => {
      const world = s.worlds[worldId];
      if (!world) return s;
      return { worlds: { ...s.worlds, [worldId]: { ...world, log: [...world.log, entry] } } };
    }),
  reset: () => set(initialState),
}));
