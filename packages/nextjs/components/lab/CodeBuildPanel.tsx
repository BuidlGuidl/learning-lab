"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ThemedToken } from "shiki";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { decodeFontStyle, getHighlighter } from "~~/components/code/highlighter";
import type { Segment } from "~~/lib/lab/regions";
import { renderProgram } from "~~/lib/lab/render";
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
  wholeBlock?: boolean;
  label?: string;
};

const placeholderFor = (id: string) => `${id.replace(/-/g, " ")} · your task`;

// The panel's view of renderProgram: filled/text lines pass through, unfilled
// regions become a ghost line the JSX swaps for a badge. Marker-stripping and
// focus-span tracking already happened in renderProgram (lib/lab/render.ts).
function renderLines(segments: Segment[], fills: Record<string, string>): RenderedLine[] {
  return renderProgram(segments, fills).map(line => ({
    text: line.placeholder ? `${line.indent}// ${placeholderFor(line.regionId as string)}` : line.text,
    regionId: line.regionId,
    ghost: line.placeholder,
    indent: line.indent,
  }));
}

// Count net braces on a line, ignoring those inside // comments and "string" literals.
// Block comments (/* */) and the naive endsWith("{") opener scan below aren't handled —
// this only drives the cosmetic focus highlight, not grading, so it stays lightweight.
function netBraces(line: string): number {
  let count = 0;
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === "\\" && i + 1 < line.length) {
        i++;
        continue;
      }
      if (ch === stringChar) inString = false;
    } else if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
    } else if (ch === "/" && line[i + 1] === "/") {
      break; // rest of line is a comment
    } else if (ch === "{") {
      count++;
    } else if (ch === "}") {
      count--;
    }
  }
  return count;
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
    depth += netBraces(lines[i]);
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

// React CSSProperties form of the shared font-style decode (highlighter.ts).
function fontStyleOf(fontStyle?: number): React.CSSProperties {
  const { italic, bold, underline } = decodeFontStyle(fontStyle);
  return {
    fontStyle: italic ? "italic" : undefined,
    fontWeight: bold ? 700 : undefined,
    textDecoration: underline ? "underline" : undefined,
  };
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
    // The spotlight for read-only code cards is rendered inline by CodeCard
    // (named <focus> spans + the .code-focus effect). The build panel just
    // switches the rail to the card's file; it doesn't re-light the span.
    return { file: card.file, label: card.title };
  }
  return {};
}

export const CodeBuildPanel = ({ lab }: { lab: Lab }) => {
  const labFiles = useLabStore(s => s.files);
  const regions = useLabStore(s => s.regions);
  const progress = useLabStore(s => s.progress);
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);

  const [showFocus, setShowFocus] = useState(true);
  // null = follow the current card's file; string = tab the learner picked.
  const [pickedFile, setPickedFile] = useState<string | null>(null);
  const [tokens, setTokens] = useState<ThemedToken[][] | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const codeTheme = "github-dark-dimmed";

  const files = Object.keys(labFiles);
  const card = lab.chapters[chapterIndex]?.cards[cardIndex];
  const focus = useMemo(() => focusForCard(card, lab), [card, lab]);
  const defaultFile = focus.file && labFiles[focus.file] ? focus.file : files[0];
  const shownFile = pickedFile ?? defaultFile;
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
  // Keyed on card position, not focus content — two cards with identical focus
  // (e.g. same region) still reset showFocus and scroll on navigation.
  const focusKey = `${chapterIndex}:${cardIndex}`;

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
    }

    return set;
  }, [shownFile, focus, renderedLines, textLines]);

  const hasFocus = focusLines.size > 0;
  const focusOn = hasFocus && showFocus;
  const writtenCount = fileRegions.filter(region => fills[region.id] !== undefined).length;

  useEffect(() => {
    setShowFocus(true);
    setPickedFile(null);
  }, [focusKey]);

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
    <aside
      className="lab-build-panel box-border flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-dark-surface text-dark-text"
      aria-label={`Building ${shownFile}`}
    >
      <div className="shrink-0 border-b border-dark-border bg-dark-bg px-[18px] pt-4 pb-3.5">
        {files.length > 1 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {files.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPickedFile(f)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-2.5 py-1.5 font-mono text-xs leading-none transition-colors ${
                    f === shownFile
                      ? "bg-lab-code-panel-tint text-violet-bright"
                      : "text-dark-text-muted hover:text-dark-text"
                  }`}
                >
                  <CodeBracketIcon className="h-3.5 w-3.5" />
                  {f}
                </button>
              ))}
            </div>
            {fileRegions.length > 0 && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-[3px] rounded-full border border-dark-border bg-lab-code-panel-tint px-2 py-1 font-mono text-[11px] leading-none text-dark-text">
                <strong className="font-normal">{writtenCount}</strong>
                <span className="max-[520px]:hidden"> of {fileRegions.length} tasks</span>
                <span className="hidden max-[520px]:inline">/{fileRegions.length}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-dark-text">
              <CodeBracketIcon className="h-4 w-4 shrink-0 text-violet-bright" />
              <span className="overflow-hidden text-ellipsis">{shownFile}</span>
              {fileRegions.length > 0 && (
                <span className="inline-flex shrink-0 items-center gap-[3px] rounded-full border border-dark-border bg-lab-code-panel-tint px-2 py-1 font-mono text-[11px] leading-none text-dark-text">
                  <strong className="font-normal">{writtenCount}</strong>
                  <span className="max-[520px]:hidden"> of {fileRegions.length} tasks</span>
                  <span className="hidden max-[520px]:inline">/{fileRegions.length}</span>
                </span>
              )}
            </span>
          </div>
        )}
        {focus.label && hasFocus ? (
          <button
            type="button"
            className="mt-3 inline-flex max-w-full cursor-pointer items-center gap-[7px] border-0 bg-transparent p-0 text-left font-mono text-xs leading-normal text-dark-text-muted hover:text-dark-text"
            onClick={() => setShowFocus(value => !value)}
            title={focusOn ? "Show the whole contract" : "Focus the current task"}
          >
            <span
              className={`h-[7px] w-[7px] shrink-0 rounded-full ${focusOn ? "bg-violet-bright" : "bg-dark-text-faint"}`}
              aria-hidden
            />
            {focusOn ? "on this card" : "focus this card"} ·{" "}
            <strong className="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-violet-bright">
              {focus.label}
            </strong>
          </button>
        ) : (
          <p className="mt-3 mb-0 text-xs leading-normal text-dark-text-muted">
            The contract updates as you finish each task. Lavender labels mark the parts you still write.
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
                <span className="w-9 flex-none pr-2.5 text-right text-dark-text-faint select-none">
                  {String(index + 1).padStart(2, " ")}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {line.ghost ? (
                    <>
                      <span style={{ whiteSpace: "pre" }}>{line.indent}</span>
                      <span className="inline-flex items-center rounded-md border border-lab-code-panel-stub-border bg-lab-code-panel-stub px-[7px] font-normal italic text-lab-code-panel-stub-text shadow-[0_1px_4px_rgb(0_0_0/0.1)]">
                        {placeholderFor(line.regionId ?? "task")}
                      </span>
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
                </span>
              </div>
            );
          })}
        </pre>
      </div>
    </aside>
  );
};
