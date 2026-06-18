// Region extraction — the one derive step of the lab model.
//
// A lab's contracts are finished, compiling .sol files. Exercises are spans
// marked with comment pairs, so the file stays valid solidity in any editor:
//
//   // <region id="buy-tokens">
//   uint256 amount = msg.value * tokensPerEth;
//   yourToken.transfer(msg.sender, amount);
//   // </region>
//
// extractRegions parses a file into segments: literal text, and region holes
// the learner fills. Every view is rendered from segments + fills — the
// learner-facing display (render.ts) and the grading assembly (assemble.ts).
// The contract is the single source of truth; nothing else is stored.

export type RegionScope = "body" | "member";

export type Region = {
  id: string;
  file: string;
  // member = the signature is part of the lesson (learner writes the whole
  // member); body = the signature is given as read-only context
  scope: RegionScope;
  canonical: string;
};

export type Segment = { kind: "text"; text: string } | { kind: "region"; id: string; indent: string };

const OPEN_RE = /^(\s*)\/\/\s*<region\s+id="([a-z0-9-]+)"(?:\s+scope="(body|member)")?\s*>\s*$/;
const CLOSE_RE = /^\s*\/\/\s*<\/region>\s*$/;

export function extractRegions(source: string, file: string): { segments: Segment[]; regions: Record<string, Region> } {
  const segments: Segment[] = [];
  const regions: Record<string, Region> = {};

  let textLines: string[] = [];
  let open: { id: string; scope: RegionScope; indent: string; lines: string[] } | null = null;

  const flushText = () => {
    if (textLines.length) segments.push({ kind: "text", text: textLines.join("\n") });
    textLines = [];
  };

  for (const line of source.split("\n")) {
    const opened = line.match(OPEN_RE);
    if (opened) {
      if (open) throw new Error(`${file}: region "${opened[2]}" opened inside region "${open.id}" — no nesting`);
      const [, indent, id, scope] = opened;
      if (regions[id]) throw new Error(`${file}: duplicate region id "${id}"`);
      flushText();
      open = { id, scope: (scope as RegionScope) ?? "body", indent, lines: [] };
      continue;
    }
    if (CLOSE_RE.test(line)) {
      if (!open) throw new Error(`${file}: </region> with no open region`);
      // canonical is stored dedented to the region's indent; renderers re-apply
      // the indent per line, so canonicals and learner fills take the same path
      const { indent } = open;
      const canonical = open.lines.map(l => (l.startsWith(indent) ? l.slice(indent.length) : l)).join("\n");
      regions[open.id] = { id: open.id, file, scope: open.scope, canonical };
      segments.push({ kind: "region", id: open.id, indent });
      open = null;
      continue;
    }
    (open ? open.lines : textLines).push(line);
  }

  if (open) throw new Error(`${file}: region "${open.id}" never closed`);
  flushText();
  return { segments, regions };
}

// Extract every file of a lab; region ids are lab-global (cards and tests
// reference them without a filename), so an id used twice across files errors.
export function extractLabContracts(contracts: Record<string, string>): {
  files: Record<string, Segment[]>;
  regions: Record<string, Region>;
} {
  const files: Record<string, Segment[]> = {};
  const regions: Record<string, Region> = {};
  for (const [file, source] of Object.entries(contracts)) {
    const extracted = extractRegions(source, file);
    files[file] = extracted.segments;
    for (const region of Object.values(extracted.regions)) {
      if (regions[region.id]) {
        throw new Error(`region id "${region.id}" appears in both ${regions[region.id].file} and ${file}`);
      }
      regions[region.id] = region;
    }
  }
  return { files, regions };
}
