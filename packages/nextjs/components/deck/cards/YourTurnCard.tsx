"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import type { YourTurnCard as YourTurnCardType } from "~~/lib/deck/types";
import { useDeckStore } from "~~/services/store/deck-store";

type Props = {
  card: YourTurnCardType;
};

export const YourTurnCard = ({ card }: Props) => {
  const completeYourTurn = useDeckStore(s => s.completeYourTurn);
  const saved = useDeckStore(s => s.progress[card.id]?.learnerInput ?? "");
  const [input, setInput] = useState(saved);

  const submitted = saved.length > 0;

  const handleSubmit = () => {
    completeYourTurn(card.id, card.file, card.slot, input);
  };

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.prompt}</p>
      <textarea
        className="textarea textarea-bordered font-mono text-sm w-full"
        rows={3}
        placeholder={card.placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="card-actions justify-end mt-3">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={input.trim().length === 0}>
          {submitted ? "Update" : "Submit"}
        </button>
      </div>
      {submitted && <p className="text-sm text-success mt-2">Saved. Hit Next to see it in context.</p>}
    </CardFrame>
  );
};
