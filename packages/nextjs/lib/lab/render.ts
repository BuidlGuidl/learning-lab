// The learner-facing rendering of a file: filled regions show their code,
// unfilled regions stand in with a placeholder, and `<focus>` marker lines are
// dropped so no view ever shows the raw markers. Pure view over segments +
// fills — nothing here exists in any stored source. Two consumers read from the
// one walk below (renderProgram): the inline code view (renderDisplay) and the
// build panel (CodeBuildPanel.renderLines).
import { indentBlock } from "./assemble";
import { FOCUS_CLOSE_RE, FOCUS_OPEN_RE } from "./focus";
import type { Segment } from "./regions";

export type ProgramLine = {
  // Source text for the line. Empty for an unfilled region — that's a single
  // placeholder line each consumer renders its own way (a literal comment
  // inline, a styled badge in the build panel), so the text isn't baked here.
  text: string;
  regionId: string | null;
  placeholder: boolean;
  indent: string;
  // Focus spans this line sits inside; the `<focus>` markers themselves are
  // stripped. Region lines inherit the span open around them (focus wraps
  // regions, per analyzeFocus), so the build panel and inline view agree.
  focusIds: string[];
};

// The single walk over segments + fills. Strips focus markers while recording
// which span each surviving line belongs to, expands filled regions to their
// code, and leaves unfilled regions as one placeholder line.
export function renderProgram(segments: Segment[], fills: Record<string, string>): ProgramLine[] {
  const lines: ProgramLine[] = [];
  let openFocus: string | null = null;

  const push = (text: string, regionId: string | null, placeholder: boolean, indent: string) =>
    lines.push({ text, regionId, placeholder, indent, focusIds: openFocus ? [openFocus] : [] });

  for (const seg of segments) {
    if (seg.kind === "text") {
      for (const text of seg.text.split("\n")) {
        const trimmed = text.trim();
        const open = trimmed.match(FOCUS_OPEN_RE);
        if (open) {
          openFocus = open[1];
          continue;
        }
        if (FOCUS_CLOSE_RE.test(trimmed)) {
          openFocus = null;
          continue;
        }
        push(text, null, false, "");
      }
      continue;
    }

    const fill = fills[seg.id];
    if (fill !== undefined) {
      for (const text of indentBlock(fill, seg.indent).split("\n")) push(text, seg.id, false, seg.indent);
    } else {
      push("", seg.id, true, seg.indent);
    }
  }

  return lines;
}

const inlinePlaceholder = (id: string) => `// ${id.replace(/-/g, " ")} · you'll write this in a later card`;

// Inline code view: a single highlighted string, the placeholder lines to dim
// (softLines), and each focus span's line numbers so a card can light a subset.
export function renderDisplay(
  segments: Segment[],
  fills: Record<string, string>,
): { code: string; softLines: number[]; focus: Record<string, number[]> } {
  const out: string[] = [];
  const softLines: number[] = [];
  const focus: Record<string, number[]> = {};

  for (const line of renderProgram(segments, fills)) {
    out.push(line.placeholder ? line.indent + inlinePlaceholder(line.regionId as string) : line.text);
    const ln = out.length; // 1-based
    if (line.placeholder) softLines.push(ln);
    for (const id of line.focusIds) (focus[id] ??= []).push(ln);
  }

  return { code: out.join("\n"), softLines, focus };
}
