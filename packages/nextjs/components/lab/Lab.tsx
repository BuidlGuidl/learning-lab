"use client";

import { useEffect } from "react";
import { CardRenderer } from "./CardRenderer";
import type { Lab as LabType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: LabType;
};

export const Lab = ({ lab }: Props) => {
  const cardIndex = useLabStore(s => s.cardIndex);
  const init = useLabStore(s => s.init);
  const next = useLabStore(s => s.next);
  const prev = useLabStore(s => s.prev);

  useEffect(() => {
    init(lab);
  }, [lab, init]);

  const card = lab.cards[cardIndex];
  const total = lab.cards.length;

  if (!card) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-xl font-semibold">{lab.title}</h1>
        <span className="text-sm text-base-content/60">
          {cardIndex + 1} / {total}
        </span>
      </div>
      <CardRenderer card={card} />
      <div className="w-full max-w-3xl flex justify-between">
        <button className="btn btn-ghost" onClick={prev} disabled={cardIndex === 0}>
          Prev
        </button>
        <button className="btn btn-primary" onClick={next} disabled={cardIndex >= total - 1}>
          Next
        </button>
      </div>
    </div>
  );
};
