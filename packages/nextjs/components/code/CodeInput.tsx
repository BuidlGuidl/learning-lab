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
const toHtmlLines = (highlighter: Highlighter, code: string, theme: "github-dark-dimmed" | "github-light") =>
  highlighter.codeToTokensBase(code, { lang: "solidity", theme }).map(line =>
    line
      .map(tok => {
        const styles = [tok.color ? `color:${tok.color}` : "", ...shikiFontStyleToCss(tok.fontStyle)];
        return `<span style="${styles.filter(Boolean).join(";")}">${escapeHtml(tok.content)}</span>`;
      })
      .join(""),
  );

const toHtml = (highlighter: Highlighter, code: string, theme: "github-dark-dimmed" | "github-light") =>
  toHtmlLines(highlighter, code, theme).join("\n");

const lineAt = (textarea: HTMLTextAreaElement) =>
  textarea.value.slice(0, textarea.selectionStart).split("\n").length - 1;

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
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const usesLineGhostPlaceholder = Boolean(placeholder?.includes("\n"));

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then(h => {
      if (!cancelled) setHighlighter(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const highlight = (code: string) => {
    if (!usesLineGhostPlaceholder || !placeholder) {
      return highlighter ? toHtml(highlighter, code, activeTheme) : escapeHtml(code);
    }

    const valueLines = code.split("\n");
    const placeholderLines = placeholder.split("\n");
    const highlightedLines = highlighter ? toHtmlLines(highlighter, code, activeTheme) : valueLines.map(escapeHtml);
    const lineCount = Math.max(valueLines.length, placeholderLines.length);

    return Array.from({ length: lineCount }, (_, index) => {
      const valueLine = valueLines[index] ?? "";
      if (valueLine.length > 0) return highlightedLines[index] ?? escapeHtml(valueLine);

      const placeholderLine = placeholderLines[index];
      if (!placeholderLine || activeLine === index) return "";

      return `<span style="color:var(--color-editor-placeholder);font-style:italic">${escapeHtml(placeholderLine)}</span>`;
    }).join("\n");
  };

  const updateActiveLine = (target: EventTarget) => {
    if (target instanceof HTMLTextAreaElement) setActiveLine(lineAt(target));
  };

  return (
    <div
      className={`code-input-panel overflow-hidden rounded-box border border-base-300 bg-lab-inset ${readOnly ? "opacity-70" : ""}`}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        placeholder={usesLineGhostPlaceholder ? undefined : placeholder}
        readOnly={readOnly}
        padding={8}
        textareaClassName="code-slot-textarea"
        onFocus={event => updateActiveLine(event.currentTarget)}
        onClick={event => updateActiveLine(event.currentTarget)}
        onKeyDown={event => updateActiveLine(event.currentTarget)}
        onKeyUp={event => updateActiveLine(event.currentTarget)}
        onBlur={() => setActiveLine(null)}
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
