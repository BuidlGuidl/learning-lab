"use client";

import { useMemo } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { CodeBlock } from "~~/components/code/CodeBlock";
import { renderDisplay } from "~~/lib/lab/render";
import type { CodeCard as CodeCardType } from "~~/lib/lab/types";
import { canonicalFills, fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeCardType;
};

export const CodeCard = ({ card }: Props) => {
  const segments = useLabStore(s => s.files[card.file]);
  const progress = useLabStore(s => s.progress);
  const regions = useLabStore(s => s.regions);
  // reveal shows finished canonical code; otherwise filled regions show the
  // learner's code and unwritten ones a quiet placeholder. renderDisplay strips
  // the focus markers and hands back the spans, keyed by id.
  const { code, softLines, focus } = useMemo(() => {
    const fills = card.reveal ? canonicalFills(regions) : fillsOf(progress);
    return renderDisplay(segments ?? [], fills);
  }, [segments, progress, regions, card.reveal]);

  // Light the union of every named focus the card asked for.
  const litLines = useMemo(() => card.focus?.flatMap(id => focus[id] ?? []), [card.focus, focus]);

  return (
    <CardFrame card={card}>
      {card.note && <Markdown className="text-base-content/90 leading-relaxed mb-4">{card.note}</Markdown>}
      <CodeBlock code={code} lang="solidity" softLines={softLines} focus={litLines} />
    </CardFrame>
  );
};
