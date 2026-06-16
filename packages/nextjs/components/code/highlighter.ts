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
