"use client";

import { useMemo } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { CodeBlock } from "~~/components/code/CodeBlock";
import { FOCUS_CLOSE_RE, FOCUS_OPEN_RE } from "~~/lib/lab/focus";
import { renderDisplay } from "~~/lib/lab/render";
import type { CodeCard as CodeCardType } from "~~/lib/lab/types";
import { canonicalFills, fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: CodeCardType;
};

// Pull the `// <focus id="x">` … `// </focus>` markers out of the rendered code.
// Marker lines are dropped (the learner never sees them); the lines between a
// pair are collected under their id, and softLines are re-indexed to the new
// numbering. Returns an id → 1-based-lines map so a card can light any subset of
// the named spans. Focus resolves here, after regions have already rendered, so
// a focus that wraps a region just lights whatever the region rendered into.
function extractFocus(
  code: string,
  softLines: number[],
): { code: string; softLines: number[]; focus: Record<string, number[]> } {
  const lines = code.split("\n");
  const soft = new Set(softLines);
  const out: string[] = [];
  const newSoft: number[] = [];
  const focus: Record<string, number[]> = {};
  let openId: string | null = null;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const open = trimmed.match(FOCUS_OPEN_RE);
    if (open) {
      openId = open[1];
      return;
    }
    if (FOCUS_CLOSE_RE.test(trimmed)) {
      openId = null;
      return;
    }
    out.push(line);
    const newLine = out.length; // 1-based
    if (openId) (focus[openId] ??= []).push(newLine);
    if (soft.has(i + 1)) newSoft.push(newLine);
  });

  return { code: out.join("\n"), softLines: newSoft, focus };
}

export const CodeCard = ({ card }: Props) => {
  const segments = useLabStore(s => s.files[card.file]);
  const progress = useLabStore(s => s.progress);
  const regions = useLabStore(s => s.regions);
  // reveal shows finished canonical code; otherwise filled regions show the
  // learner's code and unwritten ones a quiet placeholder. Focus markers are
  // stripped here so they never reach the viewer, lit or not.
  const { code, softLines, focus } = useMemo(() => {
    const fills = card.reveal ? canonicalFills(regions) : fillsOf(progress);
    const rendered = renderDisplay(segments ?? [], fills);
    return extractFocus(rendered.code, rendered.softLines);
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
