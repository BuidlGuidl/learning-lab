"use client";

import { useEffect, useState } from "react";
import { getHighlighter } from "./highlighter";
import { useTheme } from "next-themes";

type Props = {
  code: string;
  lang?: string;
  theme?: "github-dark-dimmed" | "github-light";
  // 1-based lines rendered quieter than real code (placeholder comments for
  // not-yet-written exercises)
  softLines?: number[];
  // Render a left gutter of line numbers (editor-pane look). The numbering and
  // gutter live in the `.code-numbered` block in globals.css — they only apply
  // when this is on, so inline lesson code blocks never grow a gutter.
  showLineNumbers?: boolean;
};

export const CodeBlock = ({ code, lang = "solidity", theme, softLines, showLineNumbers = false }: Props) => {
  const { resolvedTheme } = useTheme();
  const activeTheme = theme ?? (resolvedTheme === "dark" ? "github-dark-dimmed" : "github-light");
  const [html, setHtml] = useState<string>("");
  // Stable key so callers passing a fresh inline array don't re-trigger the effect.
  const softLinesKey = softLines ? softLines.join(",") : "";

  useEffect(() => {
    let cancelled = false;
    const soft = new Set(softLines ?? []);
    getHighlighter().then(h => {
      if (cancelled) return;
      setHtml(
        h.codeToHtml(code, {
          lang,
          theme: activeTheme,
          transformers: [
            {
              line(node, line) {
                if (soft.has(line)) node.properties.style = "opacity:.45;font-style:italic";
              },
            },
          ],
        }),
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang, activeTheme, softLinesKey]);

  // Numbered mode fills its pane like an editor (no rounded corners); the
  // default mode stays a rounded inline block for lesson cards.
  const wrapperClass = showLineNumbers
    ? "code-numbered text-sm overflow-x-auto [&_pre]:p-4 [&_pre]:m-0 [&_pre]:min-h-full"
    : "text-sm overflow-x-auto [&_pre]:p-4 [&_pre]:rounded [&_pre]:m-0";

  if (!html) {
    return (
      <pre className={`bg-base-300 text-sm overflow-x-auto py-4 ${showLineNumbers ? "" : "rounded px-4"}`}>
        <code>{code}</code>
      </pre>
    );
  }

  return <div className={wrapperClass} dangerouslySetInnerHTML={{ __html: html }} />;
};
