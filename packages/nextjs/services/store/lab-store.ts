import { create } from "zustand";

type ProgressEntry = {
  learnerInput: string;
  file: string;
  slot: string;
};

type LabState = {
  currentLabId: string | null;
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
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  completeCodeExercise: (cardId: string, file: string, slot: string, learnerInput: string) => void;
  reset: () => void;
};

const initialState: LabState = {
  currentLabId: null,
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
  next: () => set(s => ({ cardIndex: s.cardIndex + 1 })),
  prev: () => set(s => ({ cardIndex: Math.max(0, s.cardIndex - 1) })),
  goTo: i => set({ cardIndex: i }),
  completeCodeExercise: (cardId, file, slot, learnerInput) =>
    set(s => {
      const progress = { ...s.progress, [cardId]: { learnerInput, file, slot } };
      return { progress, sources: deriveSources(s.skeleton, progress) };
    }),
  reset: () => set(initialState),
}));
