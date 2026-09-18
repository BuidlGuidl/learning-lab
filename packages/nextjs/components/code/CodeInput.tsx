"use client";

import { type MouseEvent, useEffect, useState } from "react";
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

const lineStartIndex = (code: string, line: number) => {
  let index = 0;
  for (let i = 0; i < line; i++) {
    index = code.indexOf("\n", index) + 1;
  }
  return index;
};

const withLineAvailable = (code: string, line: number) => {
  const lines = code.split("\n");
  while (lines.length <= line) lines.push("");
  return lines.join("\n");
};

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
  const usesLineGhostPlaceholder = Boolean(placeholder?.includes("\n"));
  const minVisibleLines = Math.max(3, placeholder?.split("\n").length ?? 1);

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
      if (!placeholderLine) return "";

      return `<span style="color:var(--color-editor-placeholder);font-style:italic">${escapeHtml(placeholderLine)}</span>`;
    }).join("\n");
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const textarea = event.currentTarget;
    if (!(textarea instanceof HTMLTextAreaElement)) return;

    if (usesLineGhostPlaceholder && !readOnly) {
      const style = window.getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(style.lineHeight) || 22;
      const paddingTop = Number.parseFloat(style.paddingTop) || 0;
      const y = event.clientY - textarea.getBoundingClientRect().top + textarea.scrollTop - paddingTop;
      const clickedLine = Math.min(Math.max(Math.floor(y / lineHeight), 0), minVisibleLines - 1);

      if (clickedLine >= textarea.value.split("\n").length) {
        const nextValue = withLineAvailable(textarea.value, clickedLine);
        const caret = lineStartIndex(nextValue, clickedLine);

        onChange(nextValue);
        requestAnimationFrame(() => {
          textarea.setSelectionRange(caret, caret);
        });
        return;
      }
    }
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
        onClick={handleClick}
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "var(--color-lab-text)",
          minHeight: `${minVisibleLines * 1.4 + 1.5}rem`,
        }}
      />
    </div>
  );
};
