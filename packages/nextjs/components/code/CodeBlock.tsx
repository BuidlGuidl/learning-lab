"use client";

import { useEffect, useState } from "react";
import { getHighlighter } from "./highlighter";

type Props = {
  code: string;
  lang?: string;
  // Render a left gutter of line numbers (editor-pane look). The numbering and
  // gutter live in the `.code-numbered` block in globals.css — they only apply
  // when this is on, so inline lesson code blocks never grow a gutter.
  showLineNumbers?: boolean;
};

export const CodeBlock = ({ code, lang = "solidity", showLineNumbers = false }: Props) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then(h => {
      if (cancelled) return;
      setHtml(h.codeToHtml(code, { lang, theme: "github-dark-dimmed" }));
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

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
