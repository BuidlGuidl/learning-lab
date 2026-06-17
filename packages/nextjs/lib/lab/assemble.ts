// Canonical-backfill assembly over segments.
//
// Every region without a fill gets its canonical; filled regions get the
// learner's text. fills = {} assembles the fully-canonical contract set
// (what the ci validator compiles and tests). fills = { [gradedId]: learnerInput }
// is the grading isolation source. A file with no regions passes through
// whole — that's a fixture.
import type { Region, Segment } from "./regions";

// every line of the content sits at the region's indent (canonicals are
// stored dedented; learner fills are typed indent-free)
export const indentBlock = (content: string, indent: string) =>
  content
    .split("\n")
    .map(l => (l.length ? indent + l : l))
    .join("\n");

export function assembleSources(
  files: Record<string, Segment[]>,
  regions: Record<string, Region>,
  fills: Record<string, string> = {},
): Record<string, string> {
  for (const id of Object.keys(fills)) {
    if (!regions[id]) throw new Error(`fill references unknown region "${id}"`);
  }

  const sources: Record<string, string> = {};
  for (const [file, segments] of Object.entries(files)) {
    sources[file] = segments
      .map(seg => {
        if (seg.kind === "text") return seg.text;
        const content = fills[seg.id] ?? regions[seg.id].canonical;
        return indentBlock(content, seg.indent);
      })
      .join("\n");
  }
  return sources;
}
