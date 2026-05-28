import { create } from "zustand";
import type { Lab } from "~~/lib/lab/types";

type ProgressEntry = {
  learnerInput: string;
  file: string;
  slot: string;
};

type LabState = {
  currentLabId: string | null;
  chapterIndex: number;
  cardIndex: number;
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
  completeCodeExercise: (cardId: string, file: string, slot: string, learnerInput: string) => void;
  reset: () => void;
};

const initialState: LabState = {
  currentLabId: null,
  chapterIndex: 0,
  cardIndex: 0,
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
  next: lab =>
    set(s => {
      const chapter = lab.chapters[s.chapterIndex];
      if (!chapter) return s;
      if (s.cardIndex < chapter.cards.length - 1) return { cardIndex: s.cardIndex + 1 };
      if (s.chapterIndex < lab.chapters.length - 1) return { chapterIndex: s.chapterIndex + 1, cardIndex: 0 };
      return s;
    }),
  prev: lab =>
    set(s => {
      if (s.cardIndex > 0) return { cardIndex: s.cardIndex - 1 };
      if (s.chapterIndex > 0) {
        const prevChapter = lab.chapters[s.chapterIndex - 1];
        return { chapterIndex: s.chapterIndex - 1, cardIndex: prevChapter.cards.length - 1 };
      }
      return s;
    }),
  completeCodeExercise: (cardId, file, slot, learnerInput) =>
    set(s => {
      const progress = { ...s.progress, [cardId]: { learnerInput, file, slot } };
      return { progress, sources: deriveSources(s.skeleton, progress) };
    }),
  reset: () => set(initialState),
}));
