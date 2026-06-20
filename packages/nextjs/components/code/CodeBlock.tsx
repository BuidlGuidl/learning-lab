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
  // 1-based lines to keep sharp under the focus spotlight; the rest dim + blur
  // until the block is hovered. The dim/focus/hover styling lives in the
  // `.code-focus` block in lab.css. Empty = no focus.
  focus?: number[];
  // Render a left gutter of line numbers (editor-pane look). The numbering and
  // gutter live in the `.code-numbered` block in lab.css — they only apply
  // when this is on, so inline lesson code blocks never grow a gutter.
  showLineNumbers?: boolean;
};

export const CodeBlock = ({ code, lang = "solidity", theme, softLines, focus, showLineNumbers = false }: Props) => {
  const { resolvedTheme } = useTheme();
  const activeTheme = theme ?? (resolvedTheme === "dark" ? "github-dark-dimmed" : "github-light");
  const [html, setHtml] = useState<string>("");
  const hasFocus = (focus?.length ?? 0) > 0;
  // Stable keys so callers passing fresh inline arrays don't re-trigger the effect.
  const softLinesKey = softLines ? softLines.join(",") : "";
  const focusKey = focus ? focus.join(",") : "";

  useEffect(() => {
    let cancelled = false;
    const soft = new Set(softLines ?? []);
    const lit = new Set(focus ?? []);
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
                if (lit.has(line)) {
                  const cls = node.properties.class;
                  node.properties.class = (typeof cls === "string" ? `${cls} ` : "") + "is-focus";
                }
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
  }, [code, lang, activeTheme, softLinesKey, focusKey]);

  // Numbered mode fills its pane like an editor (no rounded corners); the
  // default mode stays a rounded inline block for lesson cards. A focus
  // adds the dim-the-room class on top of either.
  const base = showLineNumbers
    ? "code-numbered text-sm overflow-x-auto bg-lab-inset [&_pre]:p-4 [&_pre]:m-0 [&_pre]:min-h-full [&_pre]:min-w-full"
    : "text-sm overflow-x-auto bg-lab-inset rounded [&_pre]:p-4 [&_pre]:rounded [&_pre]:m-0 [&_pre]:min-w-full";
  const wrapperClass = hasFocus ? `${base} code-focus` : base;

  if (!html) {
    return (
      <pre className={`bg-base-300 text-sm overflow-x-auto py-4 ${showLineNumbers ? "" : "rounded px-4"}`}>
        <code>{code}</code>
      </pre>
    );
  }

  return <div className={wrapperClass} dangerouslySetInnerHTML={{ __html: html }} />;
};
