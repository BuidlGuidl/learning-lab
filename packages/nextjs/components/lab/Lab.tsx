"use client";

import { useEffect } from "react";
import { CardRenderer } from "./CardRenderer";
import { isCardCleared } from "~~/lib/grader/transcript";
import type { Lab as LabType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: LabType;
};

const isGradable = (type: string) => type === "code-exercise" || type === "question";

export const Lab = ({ lab }: Props) => {
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);
  const transcript = useLabStore(s => s.transcript);
  const init = useLabStore(s => s.init);
  const next = useLabStore(s => s.next);
  const prev = useLabStore(s => s.prev);
  const skipCard = useLabStore(s => s.skipCard);

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

  // Gate: a gradable card locks forward nav until cleared (pass or skip). prev stays free.
  const gated = isGradable(card.type) && !isCardCleared(transcript, card.id);

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
      <CardRenderer card={card} chapterId={chapter.id} />
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button className="btn btn-ghost" onClick={() => prev(lab)} disabled={atFirstCard}>
          Prev
        </button>
        <div className="flex items-center gap-3">
          {gated && (
            // TODO: (remove-skip) dev-only escape hatch; remove before learner-facing.
            <button
              className="btn btn-ghost btn-sm text-base-content/50"
              onClick={() => {
                skipCard(card, chapter.id);
                next(lab);
              }}
            >
              skip for now
            </button>
          )}
          <button className="btn btn-primary" onClick={() => next(lab)} disabled={atLastCard || gated}>
            Next
          </button>
        </div>
      </div>
      {gated && <p className="text-sm text-base-content/50 -mt-3">Pass this card to unlock the next one.</p>}
    </div>
  );
};
