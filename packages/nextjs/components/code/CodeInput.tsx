"use client";

import { useEffect, useState } from "react";
import { getHighlighter, shikiFontStyleToCss } from "./highlighter";
import { useTheme } from "next-themes";
import Editor from "react-simple-code-editor";
import type { Highlighter } from "shiki";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Overlay editor: a transparent textarea over a Shiki-highlighted layer. The
// highlight runs through the SAME Shiki highlighter as the read-only CodeBlock,
// on the active light/dark theme, so the editor's colors track the page exactly.
const toHtml = (highlighter: Highlighter, code: string, theme: "github-dark-dimmed" | "github-light") =>
  highlighter
    .codeToTokensBase(code, { lang: "solidity", theme })
    .map(line =>
      line
        .map(tok => {
          const styles = [tok.color ? `color:${tok.color}` : "", ...shikiFontStyleToCss(tok.fontStyle)];
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
  // Track the active theme so the highlight, text, and surface match the light/dark
  // page — the same logic the read-only CodeBlock uses.
  const { resolvedTheme } = useTheme();
  const activeTheme = resolvedTheme === "dark" ? "github-dark-dimmed" : "github-light";
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

  const highlight = (code: string) => (highlighter ? toHtml(highlighter, code, activeTheme) : escapeHtml(code));

  return (
    <div
      className={`code-input-panel overflow-hidden rounded-box border border-base-300 bg-lab-inset ${readOnly ? "opacity-70" : ""}`}
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
          color: "var(--color-lab-text)",
          minHeight: "4.5rem",
        }}
      />
    </div>
  );
};
