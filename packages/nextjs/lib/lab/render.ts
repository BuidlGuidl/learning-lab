// The learner-facing rendering of a file: filled regions show their code,
// unfilled regions show a quiet placeholder comment, and `<focus>` marker lines
// are stripped to spans so no view ever shows the raw markers. Pure view over
// segments + fills — nothing here exists in any stored source.
import { indentBlock } from "./assemble";
import { FOCUS_CLOSE_RE, FOCUS_OPEN_RE } from "./focus";
import type { Segment } from "./regions";

const placeholderFor = (id: string) => `// ${id.replace(/-/g, " ")} · you'll write this in a later card`;

export function renderDisplay(
  segments: Segment[],
  fills: Record<string, string>,
): { code: string; softLines: number[]; focus: Record<string, number[]> } {
  const softLines: number[] = [];
  const out: string[] = [];
  let line = 1;

  for (const seg of segments) {
    if (seg.kind === "text") {
      out.push(seg.text);
      line += seg.text.split("\n").length;
      continue;
    }
    const fill = fills[seg.id];
    if (fill !== undefined) {
      out.push(indentBlock(fill, seg.indent));
      line += fill.split("\n").length;
    } else {
      softLines.push(line);
      out.push(seg.indent + placeholderFor(seg.id));
      line += 1;
    }
  }

  return stripFocus(out.join("\n"), softLines);
}

// Drop the `// <focus id="x">` … `// </focus>` marker lines (no view should ever
// show them) and return the lines each pair wrapped, keyed by id, so a card can
// light any subset. softLines are re-indexed to the trimmed line numbering. This
// runs for every rendered file, so the markers can't leak into Code Peek or any
// other consumer — stripping lives at the one shared render step, not per-card.
function stripFocus(
  code: string,
  softLines: number[],
): { code: string; softLines: number[]; focus: Record<string, number[]> } {
  const soft = new Set(softLines);
  const out: string[] = [];
  const newSoft: number[] = [];
  const focus: Record<string, number[]> = {};
  let openId: string | null = null;

  code.split("\n").forEach((lineText, i) => {
    const trimmed = lineText.trim();
    const open = trimmed.match(FOCUS_OPEN_RE);
    if (open) {
      openId = open[1];
      return;
    }
    if (FOCUS_CLOSE_RE.test(trimmed)) {
      openId = null;
      return;
    }
    out.push(lineText);
    const newLine = out.length; // 1-based
    if (openId) (focus[openId] ??= []).push(newLine);
    if (soft.has(i + 1)) newSoft.push(newLine);
  });

  return { code: out.join("\n"), softLines: newSoft, focus };
}
