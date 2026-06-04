import { create } from "zustand";
import type { GradingEvent, LearningTranscript } from "~~/lib/grader/transcript";
import { isCardCleared, nextAttempt } from "~~/lib/grader/transcript";
import type { Card, Lab } from "~~/lib/lab/types";

type ProgressEntry = {
  learnerInput: string;
  file: string;
  slot: string;
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
  skeleton: Record<string, string>;
  sources: Record<string, string>;
  // Every slot token this lab declares (one per code-exercise card). Captured at
  // init so the compile path can tell a real slot from arbitrary learner text.
  slotTokens: string[];
  progress: Record<string, ProgressEntry>;
  transcript: LearningTranscript;
};

type LabActions = {
  init: (lab: Lab) => void;
  next: (lab: Lab) => void;
  prev: (lab: Lab) => void;
  goTo: (chapterIndex: number, cardIndex: number) => void;
  completeCodeExercise: (cardId: string, file: string, slot: string, learnerInput: string) => void;
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
  skeleton: {},
  sources: {},
  slotTokens: [],
  progress: {},
  transcript: emptyTranscript,
};

// The source handed to the compiler for a file. A code-exercise fills one slot,
// but later slots in the same file are still bare `__SLOT__` tokens — not valid
// Solidity, so the whole file would fail to compile and wrongly fail a correct
// answer. Strip every still-present declared slot token so the file compiles
// against what the learner has actually written so far. Only ever removes tokens
// the lab declared (slotTokens), never learner code; the display path keeps the
// raw tokens so the peek still shows the honest "not written yet" state.
export const compileSourceOf = (s: LabState, file: string) => {
  let src = s.sources[file] ?? "";
  for (const token of s.slotTokens) src = src.split(token).join("");
  return src;
};

// Gradable cards gate forward nav; read-only types advance freely.
const isGradable = (card: Card) => card.type === "code-exercise" || card.type === "question";

// Re-derive sources from skeleton + all progress entries so re-submitting a code-exercise
// card replaces its slot freshly instead of becoming a no-op against an already-filled source.
const deriveSources = (skeleton: Record<string, string>, progress: Record<string, ProgressEntry>) => {
  const sources: Record<string, string> = { ...skeleton };
  for (const { file, slot, learnerInput } of Object.values(progress)) {
    if (sources[file] !== undefined) {
      sources[file] = sources[file].replace(slot, learnerInput);
    }
  }
  return sources;
};

export const useLabStore = create<LabState & LabActions>(set => ({
  ...initialState,
  init: lab =>
    set(s => {
      // Idempotent: re-mounting the same lab (e.g. React strict-mode double-effect)
      // must not wipe in-flight progress. Switching to a different lab restarts.
      if (s.currentLabId === lab.id) return s;
      // Each code-exercise declares one slot; collect them so the compile path
      // can strip the unfilled ones (see compileSourceOf).
      const slotTokens = lab.chapters
        .flatMap(ch => ch.cards)
        .flatMap(c => (c.type === "code-exercise" ? [c.slot] : []));
      return {
        ...initialState,
        currentLabId: lab.id,
        skeleton: { ...lab.skeleton },
        sources: { ...lab.skeleton },
        slotTokens,
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
  // Raw text stays in progress (not just the mutated source) so a re-grade can flip a verdict
  // without losing what was typed.
  completeCodeExercise: (cardId, file, slot, learnerInput) =>
    set(s => {
      const progress = { ...s.progress, [cardId]: { learnerInput, file, slot } };
      return { progress, sources: deriveSources(s.skeleton, progress) };
    }),
  // Record a grade. The gate reads clearance back out of the transcript, so a pass here is
  // what opens next().
  appendGradingEvent: event => set(s => ({ transcript: { ...s.transcript, events: [...s.transcript.events, event] } })),
  // Dev-only escape hatch. Writes a "skipped" event (captures where learners bail) and threads
  // the canonical into sources — only on a deliberate skip, never a fail — so later reveal
  // cards don't show a raw __SLOT__.
  // TODO(remove-skip): drop before this is learner-facing.
  skipCard: (card, chapterId) =>
    set(s => {
      const attempt = nextAttempt(s.transcript, card.id);
      const event: GradingEvent = { cardId: card.id, chapterId, attempt, outcome: "skipped", happenedAt: Date.now() };
      let progress = s.progress;
      if (card.type === "code-exercise") {
        progress = { ...s.progress, [card.id]: { learnerInput: card.canonical, file: card.file, slot: card.slot } };
      }
      return {
        transcript: { ...s.transcript, events: [...s.transcript.events, event] },
        progress,
        sources: deriveSources(s.skeleton, progress),
      };
    }),
  reset: () => set(initialState),
}));
