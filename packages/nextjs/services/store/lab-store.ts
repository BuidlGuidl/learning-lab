import { create } from "zustand";
import type { Lab } from "~~/lib/lab/types";

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
  progress: Record<string, ProgressEntry>;
};

type LabSeed = {
  id: string;
  skeleton: Record<string, string>;
};

type LabActions = {
  init: (lab: LabSeed) => void;
  next: (lab: Lab) => void;
  prev: (lab: Lab) => void;
  goTo: (chapterIndex: number, cardIndex: number) => void;
  completeCodeExercise: (cardId: string, file: string, slot: string, learnerInput: string) => void;
  reset: () => void;
};

const initialState: LabState = {
  currentLabId: null,
  chapterIndex: 0,
  cardIndex: 0,
  maxReached: { chapterIndex: 0, cardIndex: 0 },
  skeleton: {},
  sources: {},
  progress: {},
};

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
      return {
        ...initialState,
        currentLabId: lab.id,
        skeleton: { ...lab.skeleton },
        sources: { ...lab.skeleton },
      };
    }),
  // Chapter-aware nav. Within-chapter advance is the default; overflow
  // crosses to next chapter's first card, underflow to previous chapter's
  // last card. At lab edges, no-op so the shell can disable the button.
  next: lab =>
    set(s => {
      const chapter = lab.chapters[s.chapterIndex];
      if (!chapter) return s;
      let to: Position;
      if (s.cardIndex < chapter.cards.length - 1) to = { chapterIndex: s.chapterIndex, cardIndex: s.cardIndex + 1 };
      else if (s.chapterIndex < lab.chapters.length - 1) to = { chapterIndex: s.chapterIndex + 1, cardIndex: 0 };
      else return s;
      // Sequential advance is what earns the unlock; bump the watermark when we pass it.
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
  // Raw text stays in progress (not just the mutated source) so future
  // grading can flip a verdict without losing what was typed.
  completeCodeExercise: (cardId, file, slot, learnerInput) =>
    set(s => {
      const progress = { ...s.progress, [cardId]: { learnerInput, file, slot } };
      return { progress, sources: deriveSources(s.skeleton, progress) };
    }),
  reset: () => set(initialState),
}));
