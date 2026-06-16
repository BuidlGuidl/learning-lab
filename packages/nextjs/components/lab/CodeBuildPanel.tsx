"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { ThemedToken } from "shiki";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { getHighlighter } from "~~/components/code/highlighter";
import { indentBlock } from "~~/lib/lab/assemble";
import type { Segment } from "~~/lib/lab/regions";
import type { Card, Lab } from "~~/lib/lab/types";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

type RenderedLine = {
  text: string;
  regionId: string | null;
  ghost: boolean;
  indent: string;
};

type BuildFocus = {
  file?: string;
  regionId?: string;
  fromAnchor?: string;
  toAnchor?: string;
  wholeBlock?: boolean;
  label?: string;
};

const placeholderFor = (id: string) => `${id.replace(/-/g, " ")} · your task`;

function renderLines(segments: Segment[], fills: Record<string, string>): RenderedLine[] {
  const lines: RenderedLine[] = [];

  for (const seg of segments) {
    if (seg.kind === "text") {
      for (const text of seg.text.split("\n")) lines.push({ text, regionId: null, ghost: false, indent: "" });
      continue;
    }

    const fill = fills[seg.id];
    if (fill !== undefined) {
      for (const text of indentBlock(fill, seg.indent).split("\n")) {
        lines.push({ text, regionId: seg.id, ghost: false, indent: seg.indent });
      }
    } else {
      lines.push({
        text: `${seg.indent}// ${placeholderFor(seg.id)}`,
        regionId: seg.id,
        ghost: true,
        indent: seg.indent,
      });
    }
  }

  return lines;
}

function enclosingFunctionBlock(lines: string[], regionLine: number): [number, number] | null {
  let open = -1;
  for (let i = regionLine; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.endsWith("{")) {
      if (/\bcontract\b/.test(trimmed)) return null;
      open = i;
      break;
    }
  }
  if (open === -1) return null;

  let depth = 0;
  for (let i = open; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    if (depth === 0) return [open, i];
  }
  return null;
}

function scrollWithin(container: HTMLElement, el: HTMLElement) {
  const cRect = container.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  const delta = eRect.top - cRect.top - (container.clientHeight - eRect.height) / 2;
  container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
}

function fontStyleOf(fontStyle?: number) {
  if (!fontStyle || fontStyle < 0) return {};
  const style: React.CSSProperties = {};
  if (fontStyle & 1) style.fontStyle = "italic";
  if (fontStyle & 2) style.fontWeight = 700;
  if (fontStyle & 4) style.textDecoration = "underline";
  return style;
}

function focusForCard(card: Card | undefined, lab: Lab): BuildFocus {
  if (!card) return {};
  if (card.type === "code-exercise") {
    const region = lab.regions[card.region];
    return {
      file: region?.file,
      regionId: card.region,
      wholeBlock: region?.scope === "body",
      label: card.title,
    };
  }
  if (card.type === "code") {
    return {
      file: card.file,
      fromAnchor: card.fromAnchor,
      toAnchor: card.toAnchor,
      label: card.title,
    };
  }
  return {};
}

export const CodeBuildPanel = ({ lab }: { lab: Lab }) => {
  const { resolvedTheme } = useTheme();
  const labFiles = useLabStore(s => s.files);
  const regions = useLabStore(s => s.regions);
  const progress = useLabStore(s => s.progress);
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);

  const [showFocus, setShowFocus] = useState(true);
  const [tokens, setTokens] = useState<ThemedToken[][] | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const codeTheme = resolvedTheme === "dark" ? "github-dark-dimmed" : "github-light";

  const files = Object.keys(labFiles);
  const card = lab.chapters[chapterIndex]?.cards[cardIndex];
  const focus = useMemo(() => focusForCard(card, lab), [card, lab]);
  const shownFile = focus.file && labFiles[focus.file] ? focus.file : files[0];
  const fills = useMemo(() => fillsOf(progress), [progress]);
  const fileRegions = useMemo(
    () => Object.values(regions).filter(region => region.file === shownFile),
    [regions, shownFile],
  );

  const renderedLines = useMemo(
    () => (shownFile ? renderLines(labFiles[shownFile] ?? [], fills) : []),
    [labFiles, shownFile, fills],
  );
  const textLines = useMemo(() => renderedLines.map(line => line.text), [renderedLines]);
  const fullText = useMemo(() => textLines.join("\n"), [textLines]);
  const focusKey = JSON.stringify(focus);

  const focusLines = useMemo(() => {
    const set = new Set<number>();
    if (!shownFile || focus.file !== shownFile) return set;

    if (focus.regionId) {
      const regionLineIndexes: number[] = [];
      renderedLines.forEach((line, index) => {
        if (line.regionId === focus.regionId) {
          set.add(index);
          regionLineIndexes.push(index);
        }
      });
      if (focus.wholeBlock) {
        for (const index of regionLineIndexes) {
          const block = enclosingFunctionBlock(textLines, index);
          if (block) {
            for (let i = block[0]; i <= block[1]; i++) set.add(i);
          }
        }
      }
    } else if (focus.fromAnchor) {
      const from = textLines.findIndex(line => line.toLowerCase().includes(focus.fromAnchor!.toLowerCase()));
      if (from !== -1) {
        let to = from;
        if (focus.toAnchor) {
          const needle = focus.toAnchor.toLowerCase();
          const found = textLines.findIndex((line, index) => index >= from && line.toLowerCase().includes(needle));
          if (found !== -1) to = found;
        }
        for (let i = from; i <= to; i++) set.add(i);
      }
    }

    return set;
  }, [shownFile, focus, renderedLines, textLines]);

  const hasFocus = focusLines.size > 0;
  const focusOn = hasFocus && showFocus;
  const writtenCount = fileRegions.filter(region => fills[region.id] !== undefined).length;

  useEffect(() => {
    setShowFocus(true);
  }, [focusKey, shownFile]);

  useEffect(() => {
    let cancelled = false;
    setTokens(null);
    getHighlighter().then(highlighter => {
      if (cancelled) return;
      setTokens(highlighter.codeToTokens(fullText, { lang: "solidity", theme: codeTheme }).tokens as ThemedToken[][]);
    });
    return () => {
      cancelled = true;
    };
  }, [fullText, codeTheme]);

  useEffect(() => {
    if (!focusOn) return;
    const id = requestAnimationFrame(() => {
      const container = codeRef.current;
      const focused = container?.querySelector<HTMLElement>(".lab-build-line--focus");
      if (container && focused) scrollWithin(container, focused);
    });
    return () => cancelAnimationFrame(id);
  }, [focusKey, focusOn]);

  if (!shownFile || renderedLines.length === 0) return null;

  const onCodeClick = (event: React.MouseEvent) => {
    if (!focusOn) return;
    if (!(event.target as HTMLElement).closest(".lab-build-line--focus")) setShowFocus(false);
  };

  return (
    <aside className="lab-build-panel" aria-label={`Building ${shownFile}`}>
      <div className="lab-build-panel__head">
        <div className="lab-build-panel__file-row">
          <span className="lab-build-panel__file">
            <CodeBracketIcon className="h-4 w-4" />
            {shownFile}
          </span>
          {fileRegions.length > 0 && (
            <span className="lab-build-panel__count">
              <strong>{writtenCount}</strong>/{fileRegions.length} pieces
            </span>
          )}
        </div>
        {focus.label && hasFocus ? (
          <button
            type="button"
            className={`lab-build-panel__focus-toggle ${focusOn ? "is-on" : "is-off"}`}
            onClick={() => setShowFocus(value => !value)}
            title={focusOn ? "Show the whole contract" : "Focus the current task"}
          >
            <span className="lab-build-panel__focus-dot" aria-hidden />
            {focusOn ? "on this card" : "focus this card"} · <strong>{focus.label}</strong>
          </button>
        ) : (
          <p className="lab-build-panel__hint">
            The contract updates as you finish each task. Dashed stubs mark the parts you still write.
          </p>
        )}
      </div>

      <div ref={codeRef} className={`lab-build-code ${focusOn ? "lab-build-code--focus" : ""}`} onClick={onCodeClick}>
        <pre>
          {renderedLines.map((line, index) => {
            const isFocus = focusOn && focusLines.has(index);
            const isFocusFirst = isFocus && !focusLines.has(index - 1);
            const isFocusLast = isFocus && !focusLines.has(index + 1);
            const lineTokens = tokens?.[index];

            return (
              <div
                key={`${index}-${line.text}`}
                className={`lab-build-line ${isFocus ? "lab-build-line--focus" : ""} ${
                  isFocusFirst ? "lab-build-line--focus-first" : ""
                } ${isFocusLast ? "lab-build-line--focus-last" : ""}`}
              >
                <span className="lab-build-line__number">{String(index + 1).padStart(2, " ")}</span>
                {line.ghost ? (
                  <>
                    <span style={{ whiteSpace: "pre" }}>{line.indent}</span>
                    <span className="lab-build-line__stub">{placeholderFor(line.regionId ?? "task")}</span>
                  </>
                ) : !lineTokens ? (
                  line.text || " "
                ) : lineTokens.length === 0 ? (
                  " "
                ) : (
                  lineTokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} style={{ color: token.color, ...fontStyleOf(token.fontStyle) }}>
                      {token.content}
                    </span>
                  ))
                )}
              </div>
            );
          })}
        </pre>
      </div>
    </aside>
  );
};
