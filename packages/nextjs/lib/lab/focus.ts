// Focus markers — `// <focus id="x"> … // </focus>` spans in contract source
// that a `code` card lights (the spotlight effect). Two consumers share the
// marker syntax defined here:
//   - render time: CodeCard.extractFocus strips the markers from already-
//     rendered output and collects each id's line numbers.
//   - build time: analyzeFocus (below) reads the *raw* source — regions still
//     present — to catch the structural collisions that would otherwise vanish
//     silently at render time. validate-labs fails the build on any.
//
// Both match against a trimmed line.
export const FOCUS_OPEN_RE = /^\/\/\s*<focus\s+id="([^"]+)">$/;
export const FOCUS_CLOSE_RE = /^\/\/\s*<\/focus>$/;

const REGION_OPEN_RE = /^\/\/\s*<region\b/;
const REGION_CLOSE_RE = /^\/\/\s*<\/region>$/;

// Static check of a single contract's focus markers. Returns the declared ids
// (for the card cross-check) and any structural errors. The invariant: focus
// spans are balanced, uniquely named, never nested in each other, and strictly
// *contain* regions rather than crossing or nesting inside them — because a
// region collapses to one placeholder line when unfilled, so any focus marker
// inside it disappears with the hole.
export function analyzeFocus(source: string): { ids: string[]; errors: string[] } {
  const lines = source.split("\n");
  const ids: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let open: string | null = null;
  let inRegion = false;

  lines.forEach((raw, i) => {
    const line = raw.trim();
    const ln = i + 1;

    if (REGION_OPEN_RE.test(line)) {
      inRegion = true;
      return;
    }
    if (REGION_CLOSE_RE.test(line)) {
      inRegion = false;
      return;
    }

    const openMatch = line.match(FOCUS_OPEN_RE);
    if (openMatch) {
      const id = openMatch[1];
      if (open) errors.push(`line ${ln}: focus "${id}" opens before "${open}" closed (focus spans can't nest)`);
      if (inRegion)
        errors.push(`line ${ln}: focus "${id}" opens inside a region (focus must wrap regions, not nest in them)`);
      if (seen.has(id)) errors.push(`line ${ln}: duplicate focus id "${id}"`);
      seen.add(id);
      ids.push(id);
      open = id;
      return;
    }
    if (FOCUS_CLOSE_RE.test(line)) {
      if (!open) errors.push(`line ${ln}: stray </focus> with no open`);
      else if (inRegion) errors.push(`line ${ln}: focus "${open}" closes inside a region (crossing a region boundary)`);
      open = null;
    }
  });

  if (open) errors.push(`focus "${open}" is never closed`);
  return { ids, errors };
}
