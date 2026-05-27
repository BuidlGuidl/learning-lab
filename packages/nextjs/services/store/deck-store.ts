import { create } from "zustand";

type ProgressEntry = {
  learnerInput: string;
  file: string;
  slot: string;
};

type DeckState = {
  currentDeckId: string | null;
  cardIndex: number;
  skeleton: Record<string, string>;
  sources: Record<string, string>;
  progress: Record<string, ProgressEntry>;
};

type DeckSeed = {
  id: string;
  skeleton: Record<string, string>;
};

type DeckActions = {
  init: (deck: DeckSeed) => void;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  completeYourTurn: (cardId: string, file: string, slot: string, learnerInput: string) => void;
  reset: () => void;
};

const initialState: DeckState = {
  currentDeckId: null,
  cardIndex: 0,
  skeleton: {},
  sources: {},
  progress: {},
};

// Re-derive sources from skeleton + all progress entries so re-submitting a your-turn
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

export const useDeckStore = create<DeckState & DeckActions>(set => ({
  ...initialState,
  init: deck =>
    set(s => {
      // Idempotent: re-mounting the same deck (e.g. React strict-mode double-effect)
      // must not wipe in-flight progress. Switching to a different deck restarts.
      if (s.currentDeckId === deck.id) return s;
      return {
        ...initialState,
        currentDeckId: deck.id,
        skeleton: { ...deck.skeleton },
        sources: { ...deck.skeleton },
      };
    }),
  next: () => set(s => ({ cardIndex: s.cardIndex + 1 })),
  prev: () => set(s => ({ cardIndex: Math.max(0, s.cardIndex - 1) })),
  goTo: i => set({ cardIndex: i }),
  completeYourTurn: (cardId, file, slot, learnerInput) =>
    set(s => {
      const progress = { ...s.progress, [cardId]: { learnerInput, file, slot } };
      return { progress, sources: deriveSources(s.skeleton, progress) };
    }),
  reset: () => set(initialState),
}));
