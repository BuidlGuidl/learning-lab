"use client";

import { useEffect } from "react";
import { CardRenderer } from "./CardRenderer";
import type { Deck as DeckType } from "~~/lib/deck/types";
import { useDeckStore } from "~~/services/store/deck-store";

type Props = {
  deck: DeckType;
};

export const Deck = ({ deck }: Props) => {
  const cardIndex = useDeckStore(s => s.cardIndex);
  const init = useDeckStore(s => s.init);
  const next = useDeckStore(s => s.next);
  const prev = useDeckStore(s => s.prev);

  useEffect(() => {
    init(deck);
  }, [deck, init]);

  const card = deck.cards[cardIndex];
  const total = deck.cards.length;

  if (!card) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-xl font-semibold">{deck.title}</h1>
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
