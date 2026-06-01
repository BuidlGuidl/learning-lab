import { create } from "zustand";
import type { GradingEvent, LearningTranscript } from "~~/lib/grader/transcript";
import { isCardCleared } from "~~/lib/grader/transcript";
import type { Card, Lab } from "~~/lib/lab/types";

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
  transcript: LearningTranscript;
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
  appendGradingEvent: (event: GradingEvent) => void;
  skipCard: (card: Card, chapterId: string) => void;
  reset: () => void;
};

const emptyTranscript: LearningTranscript = { labId: "", events: [] };

const initialState: LabState = {
  currentLabId: null,
  chapterIndex: 0,
  cardIndex: 0,
  skeleton: {},
  sources: {},
  progress: {},
  transcript: emptyTranscript,
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
      return {
        ...initialState,
        currentLabId: lab.id,
        skeleton: { ...lab.skeleton },
        sources: { ...lab.skeleton },
        transcript: { labId: lab.id, events: [] },
      };
    }),
  // Gate-aware forward nav: a gradable card blocks until cleared (pass or skip). prev stays free.
  next: lab =>
    set(s => {
      const chapter = lab.chapters[s.chapterIndex];
      if (!chapter) return s;
      const current = chapter.cards[s.cardIndex];
      if (current && isGradable(current) && !isCardCleared(s.transcript, current.id)) return s;
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
      const attempt = s.transcript.events.filter(e => e.cardId === card.id && e.outcome !== "skipped").length + 1;
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
