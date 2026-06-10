// Resolves a lab's import graph into the complete sources map solc needs.
//
// Relative imports resolve between lab files; @-scoped imports hit the
// vendored maps (OZ today, more vendor maps if a lab ever needs them). Runs
// before compile in both the browser worker and the node-side validator, so
// neither needs a filesystem or an import callback.

const IMPORT_RE = /import\s+(?:\{[^}]*\}\s+from\s+)?["']([^"']+)["']/g;

function dirname(p: string) {
  const i = p.lastIndexOf("/");
  return i === -1 ? "." : p.slice(0, i);
}

function normalize(p: string) {
  const parts: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

export function resolveSources(
  labFiles: Record<string, string>,
  vendored: Record<string, string>,
): Record<string, { content: string }> {
  const sources: Record<string, { content: string }> = {};
  const queue = Object.keys(labFiles);

  while (queue.length) {
    const key = queue.pop()!;
    if (sources[key]) continue;
    const content = labFiles[key] ?? vendored[key];
    if (content === undefined) throw new Error(`unresolvable import: ${key}`);
    sources[key] = { content };

    IMPORT_RE.lastIndex = 0;
    let m;
    while ((m = IMPORT_RE.exec(content))) {
      const imp = m[1];
      queue.push(imp.startsWith("@") ? imp : normalize(`${dirname(key)}/${imp}`));
    }
  }
  return sources;
}
