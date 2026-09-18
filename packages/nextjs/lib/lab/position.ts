import { type LearningTranscript, isCardCleared } from "../grader/transcript";
import type { Lab } from "./types";

export const totalCards = (lab: Lab): number =>
  lab.chapters.reduce((total, chapter) => total + chapter.cards.length, 0);

export const flatIndex = (lab: Lab, pos: { chapterIndex: number; cardIndex: number }): number => {
  const count = totalCards(lab);
  if (count === 0) return 0;
  if (pos.chapterIndex >= lab.chapters.length) return count - 1;

  const cardsBeforeChapter = lab.chapters
    .slice(0, Math.max(0, pos.chapterIndex))
    .reduce((total, chapter) => total + chapter.cards.length, 0);

  return Math.min(Math.max(cardsBeforeChapter + pos.cardIndex, 0), count - 1);
};

export const cardsCleared = (lab: Lab, transcript: LearningTranscript): number =>
  lab.chapters.reduce(
    (total, chapter) => total + chapter.cards.filter(card => isCardCleared(transcript, card.id)).length,
    0,
  );
