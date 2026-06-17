"use client";

import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { CodeBlock } from "~~/components/code/CodeBlock";
import type { CodeCard as CodeCardType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeCardType;
};

export const CodeCard = ({ card }: Props) => {
  const source = useLabStore(s => s.sources[card.file] ?? "");

  return (
    <CardFrame card={card}>
      {card.note && <Markdown className="text-base-content/90 leading-relaxed mb-4">{card.note}</Markdown>}
      <CodeBlock code={source} lang="solidity" />
    </CardFrame>
  );
};
