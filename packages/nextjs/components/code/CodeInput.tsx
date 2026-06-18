"use client";

import { useEffect, useState } from "react";
import { getHighlighter } from "./highlighter";
import Editor from "react-simple-code-editor";
import type { Highlighter } from "shiki";

// github-dark-dimmed editor.background / editor.foreground — same ground as CodeBlock.
const PANEL_BG = "#22272e";
const PANEL_FG = "#adbac7";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Overlay editor: a transparent textarea over a Shiki-highlighted layer. The
// highlight runs through the SAME Shiki highlighter + theme as the read-only
// CodeBlock, so the editor's colors match the reveal panel exactly — including
// tokens a CodeMirror grammar classifies differently (function names, pragma).
const toHtml = (highlighter: Highlighter, code: string) =>
  highlighter
    .codeToTokensBase(code, { lang: "solidity", theme: "github-dark-dimmed" })
    .map(line =>
      line
        .map(tok => {
          const styles = [tok.color ? `color:${tok.color}` : ""];
          const fontStyle = tok.fontStyle ?? 0;
          if (fontStyle & 1) styles.push("font-style:italic");
          if (fontStyle & 2) styles.push("font-weight:bold");
          return `<span style="${styles.filter(Boolean).join(";")}">${escapeHtml(tok.content)}</span>`;
        })
        .join(""),
    )
    .join("\n");

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export const CodeInput = ({ value, onChange, placeholder, readOnly = false }: Props) => {
  // Loads once (shared promise); until ready, render plain escaped text — same on
  // server and first client render, so there's no hydration mismatch.
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then(h => {
      if (!cancelled) setHighlighter(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const highlight = (code: string) => (highlighter ? toHtml(highlighter, code) : escapeHtml(code));

  return (
    <div
      className={`code-input-panel overflow-hidden rounded-box border border-base-300 ${readOnly ? "opacity-70" : ""}`}
      style={{ background: PANEL_BG }}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        placeholder={placeholder}
        readOnly={readOnly}
        padding={8}
        textareaClassName="code-slot-textarea"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: PANEL_FG,
          minHeight: "4.5rem",
        }}
      />
    </div>
  );
};
