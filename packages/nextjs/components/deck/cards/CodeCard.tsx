"use client";

import { CardFrame } from "../CardFrame";
import { CodeBlock } from "~~/components/code/CodeBlock";
import type { CodeCard as CodeCardType } from "~~/lib/deck/types";
import { useDeckStore } from "~~/services/store/deck-store";

type Props = {
  card: CodeCardType;
};

export const CodeCard = ({ card }: Props) => {
  const source = useDeckStore(s => s.sources[card.file] ?? "");

  return (
    <CardFrame card={card}>
      {card.note && <p className="text-base-content/90 leading-relaxed mb-4">{card.note}</p>}
      <CodeBlock code={source} lang="solidity" />
    </CardFrame>
  );
};
