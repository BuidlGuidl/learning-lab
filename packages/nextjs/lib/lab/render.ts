// The learner-facing rendering of a file: filled regions show their code,
// unfilled regions show a quiet placeholder comment. Pure view over
// segments + fills — nothing here exists in any stored source.
import { indentBlock } from "./assemble";
import type { Segment } from "./regions";

const placeholderFor = (id: string) => `// ${id.replace(/-/g, " ")} · you'll write this in a later card`;

export function renderDisplay(
  segments: Segment[],
  fills: Record<string, string>,
): { code: string; softLines: number[] } {
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
  return { code: out.join("\n"), softLines };
}
