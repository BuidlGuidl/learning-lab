"use client";

import { useEffect, useState } from "react";
import { getHighlighter } from "./highlighter";

type Props = {
  code: string;
  lang?: string;
  // 1-based lines rendered quieter than real code (placeholder comments for
  // not-yet-written exercises)
  softLines?: number[];
};

export const CodeBlock = ({ code, lang = "solidity", softLines }: Props) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const soft = new Set(softLines ?? []);
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
              },
            },
          ],
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, softLines]);

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
