"use client";

import { useMemo } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { CodeBlock } from "~~/components/code/CodeBlock";
import { renderDisplay } from "~~/lib/lab/render";
import type { CodeCard as CodeCardType } from "~~/lib/lab/types";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeCardType;
};

// Slice the rendered file to the anchor window defined on the card.
// fromAnchor: the first line that case-insensitively contains the substring
// is the start (inclusive). toAnchor: the first line after that which
// case-insensitively contains its substring ends it (exclusive). Leading and
// trailing blank lines are trimmed from the result. softLines outside the
// slice are dropped; the rest are re-offset to the new coordinates. If an
// anchor doesn't match, the whole file is returned unchanged.
function applyAnchors(
  code: string,
  softLines: number[],
  fromAnchor?: string,
  toAnchor?: string,
): { code: string; softLines: number[] } {
  if (!fromAnchor && !toAnchor) return { code, softLines };

  const lines = code.split("\n");
  let start = 0;
  let end = lines.length;

  if (fromAnchor) {
    const needle = fromAnchor.toLowerCase();
    const idx = lines.findIndex(l => l.toLowerCase().includes(needle));
    if (idx !== -1) start = idx;
  }

  if (toAnchor) {
    const needle = toAnchor.toLowerCase();
    // search from the line after start so the to-anchor can't collapse the window
    const idx = lines.findIndex((l, i) => i > start && l.toLowerCase().includes(needle));
    if (idx !== -1) end = idx;
  }

  // trim leading/trailing blank lines within the slice
  let sliceStart = start;
  let sliceEnd = end;
  while (sliceStart < sliceEnd && lines[sliceStart].trim() === "") sliceStart++;
  while (sliceEnd > sliceStart && lines[sliceEnd - 1].trim() === "") sliceEnd--;

  const slicedLines = lines.slice(sliceStart, sliceEnd);
  const slicedCode = slicedLines.join("\n");

  // 1-based line numbers in the original file: sliceStart+1 … sliceEnd (inclusive)
  const firstLine = sliceStart + 1;
  const lastLine = sliceEnd; // exclusive index = last inclusive line number

  const slicedSoftLines = softLines.filter(ln => ln >= firstLine && ln <= lastLine).map(ln => ln - sliceStart);

  return { code: slicedCode, softLines: slicedSoftLines };
}

export const CodeCard = ({ card }: Props) => {
  const segments = useLabStore(s => s.files[card.file]);
  const progress = useLabStore(s => s.progress);
  // filled regions show the learner's code; unwritten ones a quiet placeholder
  const { code, softLines } = useMemo(() => {
    const rendered = renderDisplay(segments ?? [], fillsOf(progress));
    return applyAnchors(rendered.code, rendered.softLines, card.fromAnchor, card.toAnchor);
  }, [segments, progress, card.fromAnchor, card.toAnchor]);

  return (
    <CardFrame card={card}>
      {card.note && <Markdown className="text-lg leading-[1.62] text-lab-text mb-4">{card.note}</Markdown>}
      <CodeBlock code={code} lang="solidity" softLines={softLines} />
    </CardFrame>
  );
};
