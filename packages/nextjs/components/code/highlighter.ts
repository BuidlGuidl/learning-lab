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

export type FontStyleFlags = { italic: boolean; bold: boolean; underline: boolean };

// The Shiki FontStyle bitmask (1=italic, 2=bold, 4=underline) decoded once, so
// every token renderer reads the bits from here instead of re-deriving them.
export const decodeFontStyle = (fontStyle: number | undefined): FontStyleFlags => {
  const bits = fontStyle && fontStyle > 0 ? fontStyle : 0;
  return { italic: (bits & 1) !== 0, bold: (bits & 2) !== 0, underline: (bits & 4) !== 0 };
};

// CSS-declaration strings for hand-built inline style attributes (CodeInput's HTML).
export const shikiFontStyleToCss = (fontStyle: number | undefined): string[] => {
  const { italic, bold, underline } = decodeFontStyle(fontStyle);
  const parts: string[] = [];
  if (italic) parts.push("font-style:italic");
  if (bold) parts.push("font-weight:bold");
  if (underline) parts.push("text-decoration:underline");
  return parts;
};
