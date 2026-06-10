"use client";

import { useMemo } from "react";
import { CardFrame } from "../CardFrame";
import { CodeBlock } from "~~/components/code/CodeBlock";
import { renderDisplay } from "~~/lib/lab/render";
import type { CodeCard as CodeCardType } from "~~/lib/lab/types";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeCardType;
};

export const CodeCard = ({ card }: Props) => {
  const segments = useLabStore(s => s.files[card.file]);
  const progress = useLabStore(s => s.progress);
  // filled regions show the learner's code; unwritten ones a quiet placeholder
  const { code, softLines } = useMemo(() => renderDisplay(segments ?? [], fillsOf(progress)), [segments, progress]);

  return (
    <CardFrame card={card}>
      {card.note && <p className="text-base-content/90 leading-relaxed mb-4">{card.note}</p>}
      <CodeBlock code={code} lang="solidity" softLines={softLines} />
    </CardFrame>
  );
};
