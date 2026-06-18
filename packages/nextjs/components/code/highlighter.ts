import { type Highlighter, createHighlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-dimmed", "github-light"],
      langs: ["solidity"],
    });
  }
  return highlighterPromise;
};

// Decodes the Shiki FontStyle bitmask (1=italic, 2=bold, 4=underline) into
// CSS property strings. Returns only non-empty entries so callers can join/filter.
export const shikiFontStyleToCss = (fontStyle: number | undefined): string[] => {
  if (!fontStyle || fontStyle < 0) return [];
  const parts: string[] = [];
  if (fontStyle & 1) parts.push("font-style:italic");
  if (fontStyle & 2) parts.push("font-weight:bold");
  if (fontStyle & 4) parts.push("text-decoration:underline");
  return parts;
};
