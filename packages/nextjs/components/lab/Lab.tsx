"use client";

import { useEffect } from "react";
import { CardRenderer } from "./CardRenderer";
import type { Lab as LabType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: LabType;
};

export const Lab = ({ lab }: Props) => {
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);
  const init = useLabStore(s => s.init);
  const next = useLabStore(s => s.next);
  const prev = useLabStore(s => s.prev);

  useEffect(() => {
    init(lab);
  }, [lab, init]);

  const chapter = lab.chapters[chapterIndex];
  const card = chapter?.cards[cardIndex];

  if (!chapter || !card) return null;

  const totalChapters = lab.chapters.length;
  const totalCards = chapter.cards.length;
  const atFirstCard = chapterIndex === 0 && cardIndex === 0;
  const atLastCard = chapterIndex === totalChapters - 1 && cardIndex === totalCards - 1;

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <div className="w-full max-w-3xl flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{lab.title}</h1>
          <span className="text-sm text-base-content/60">
            chapter {chapterIndex + 1} of {totalChapters} · card {cardIndex + 1} of {totalCards}
          </span>
        </div>
        <p className="text-sm text-base-content/60">{chapter.title}</p>
      </div>
      <CardRenderer card={card} />
      <div className="w-full max-w-3xl flex justify-between">
        <button className="btn btn-ghost" onClick={() => prev(lab)} disabled={atFirstCard}>
          Prev
        </button>
        <button className="btn btn-primary" onClick={() => next(lab)} disabled={atLastCard}>
          Next
        </button>
      </div>
    </div>
  );
};
