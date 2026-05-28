"use client";

import { useEffect, useState } from "react";
import { getHighlighter } from "./highlighter";

type Props = {
  code: string;
  lang?: string;
};

export const CodeBlock = ({ code, lang = "solidity" }: Props) => {
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

  if (!html) {
    return (
      <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="text-sm overflow-x-auto [&_pre]:p-4 [&_pre]:rounded [&_pre]:m-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
