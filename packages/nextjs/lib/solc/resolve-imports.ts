// Resolves a lab's import graph into the complete sources map solc needs.
//
// Relative imports resolve between lab files; @-scoped imports hit the
// vendored maps (OZ today, more vendor maps if a lab ever needs them). Runs
// before compile in both the browser worker and the node-side validator, so
// neither needs a filesystem or an import callback.
//
// The same walk also runs at build time over node_modules to vendor OZ
// (scripts/gen-oz-sources.ts). collectImportGraph is that shared crawler,
// parameterised only by how a file's source is read — a map lookup in the
// browser, a filesystem read at build time.

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

// The key an import resolves to, seen from the file that wrote it. @-scoped
// imports are bare keys into a vendored map; everything else is relative.
export function resolveImportKey(fromKey: string, importPath: string) {
  return importPath.startsWith("@") ? importPath : normalize(`${dirname(fromKey)}/${importPath}`);
}

// Walks the solidity import graph from `entries`, reading each file via `read`.
// Returns every reachable file keyed by its import path; throws on the first
// import `read` can't satisfy.
export function collectImportGraph(
  entries: string[],
  read: (key: string) => string | undefined,
): Record<string, string> {
  const collected: Record<string, string> = {};
  const queue = [...entries];

  while (queue.length) {
    const key = queue.pop()!;
    if (collected[key] !== undefined) continue;
    const content = read(key);
    if (content === undefined) throw new Error(`unresolvable import: ${key}`);
    collected[key] = content;

    IMPORT_RE.lastIndex = 0;
    let m;
    while ((m = IMPORT_RE.exec(content))) queue.push(resolveImportKey(key, m[1]));
  }
  return collected;
}

export function resolveSources(
  labFiles: Record<string, string>,
  vendored: Record<string, string>,
): Record<string, { content: string }> {
  const collected = collectImportGraph(Object.keys(labFiles), key => labFiles[key] ?? vendored[key]);
  const sources: Record<string, { content: string }> = {};
  for (const key of Object.keys(collected)) sources[key] = { content: collected[key] };
  return sources;
}
