"use client";

import { useEffect, useState } from "react";
import { getHighlighter } from "./highlighter";

type Props = {
  code: string;
  lang?: string;
  // 1-based lines rendered quieter than real code (placeholder comments for
  // not-yet-written exercises)
  softLines?: number[];
  // 1-based lines to keep sharp under the focus spotlight; the rest dim + blur
  // until the block is hovered. The dim/focus/hover styling lives in the
  // `.code-focus` block in globals.css. Empty = no focus.
  focus?: number[];
  // Render a left gutter of line numbers (editor-pane look). The numbering and
  // gutter live in the `.code-numbered` block in globals.css — they only apply
  // when this is on, so inline lesson code blocks never grow a gutter.
  showLineNumbers?: boolean;
};

export const CodeBlock = ({ code, lang = "solidity", softLines, focus, showLineNumbers = false }: Props) => {
  const [html, setHtml] = useState<string>("");
  const hasFocus = (focus?.length ?? 0) > 0;

  useEffect(() => {
    let cancelled = false;
    const soft = new Set(softLines ?? []);
    const lit = new Set(focus ?? []);
    getHighlighter().then(h => {
      if (cancelled) return;
      setHtml(
        h.codeToHtml(code, {
          lang,
          theme: "github-dark-dimmed",
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
  }, [code, lang, softLines, focus]);

  // Numbered mode fills its pane like an editor (no rounded corners); the
  // default mode stays a rounded inline block for lesson cards. A focus
  // adds the dim-the-room class on top of either.
  const base = showLineNumbers
    ? "code-numbered text-sm overflow-x-auto [&_pre]:p-4 [&_pre]:m-0 [&_pre]:min-h-full"
    : "text-sm overflow-x-auto [&_pre]:p-4 [&_pre]:rounded [&_pre]:m-0";
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
