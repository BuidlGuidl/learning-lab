"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeBracketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CodeBlock } from "~~/components/code/CodeBlock";
import { renderDisplay } from "~~/lib/lab/render";
import type { Lab } from "~~/lib/lab/types";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

// A `c` typed into an answer field is a literal c, not the peek shortcut. Only
// text-entry fields swallow letters though — a checkbox/radio/toggle (the daisyUI
// theme switcher is one) shouldn't block the shortcut while it holds focus.
const NON_TEXT_INPUT_TYPES = new Set(["checkbox", "radio", "range", "button", "submit", "reset", "file", "color"]);
const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === "TEXTAREA" || el.isContentEditable) return true;
  if (el.tagName === "INPUT") return !NON_TEXT_INPUT_TYPES.has((el as HTMLInputElement).type);
  return false;
};

// Always-available view of the running code, rendered the same way reveal
// cards render: segments + the learner's fills, with unwritten regions as
// faded placeholders. Read-only, ephemeral — open-state stays local.
// The sheet follows the lab's Lavender Paper code surface: light editor chrome,
// violet active state, and the same rendered source/fill behavior.
export const CodePeek = ({ lab }: { lab: Lab }) => {
  const labFiles = useLabStore(s => s.files);
  const regions = useLabStore(s => s.regions);
  const progress = useLabStore(s => s.progress);
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);

  const [open, setOpen] = useState(false);
  // null = follow the current card's file; a string = a tab the learner picked.
  // Reset to null on close so each open lands on the current card again.
  const [pickedFile, setPickedFile] = useState<string | null>(null);

  const files = Object.keys(labFiles);
  const card = lab.chapters[chapterIndex]?.cards[cardIndex];
  // a code card names its file; an exercise card's file comes via its region
  const cardFile =
    card && "file" in card ? card.file : card?.type === "code-exercise" ? regions[card.region]?.file : undefined;
  const defaultFile = cardFile && labFiles[cardFile] !== undefined ? cardFile : files[0];
  const shownFile = pickedFile ?? defaultFile;
  const shown = useMemo(
    () => (shownFile ? renderDisplay(labFiles[shownFile] ?? [], fillsOf(progress)) : { code: "", softLines: [] }),
    [labFiles, shownFile, progress],
  );

  const close = () => {
    setOpen(false);
    setPickedFile(null);
  };

  // c toggles, esc closes — never while the learner is typing, and never when
  // a modifier is held (leave copy/refresh/etc. alone).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        close();
        return;
      }
      if (e.key === "c" && !isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (open) close();
        else setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hold the page still behind the sheet.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (files.length === 0) return null;

  return (
    <>
      {/* Trigger — a quiet FAB in the reading column, out of the sticky header's
          way. Hidden while the sheet is up; the sheet carries its own close. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="lab-paper-code-trigger fixed z-30 flex items-center gap-2 text-sm transition-shadow border shadow-sm cursor-pointer bottom-6 right-6"
          aria-label="Peek at the current code"
        >
          <CodeBracketIcon className="w-4 h-4" />
          peek code
          <kbd className="kbd kbd-xs">c</kbd>
        </button>
      )}

      {/* Backdrop dims the lesson but leaves it faintly visible on the left. */}
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`current state of ${shownFile}`}
        aria-hidden={!open}
        className={`lab-paper-codepeek fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col transition-transform duration-200 ease-out lg:w-1/2 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Tab row — one tab per file in sources, trees.software-style pills. */}
        <div className="lab-paper-codepeek__tabs flex items-center gap-1 overflow-x-auto">
          {files.map(file => {
            const active = file === shownFile;
            return (
              <button
                key={file}
                onClick={() => setPickedFile(file)}
                className={`lab-paper-codepeek__tab flex items-center gap-1.5 font-mono text-xs whitespace-nowrap cursor-pointer transition-colors ${
                  active ? "is-active" : ""
                }`}
              >
                <CodeBracketIcon className="w-3.5 h-3.5" />
                {file}
              </button>
            );
          })}

          <button
            onClick={close}
            className="lab-paper-codepeek__close flex items-center gap-1.5 ml-auto font-mono text-xs cursor-pointer transition-colors"
            aria-label="Close code peek (esc)"
          >
            <XMarkIcon className="w-4 h-4" />
            close
            <kbd className="kbd kbd-xs">esc</kbd>
          </button>
        </div>

        {/* The running source, as a line-numbered editor pane filling the sheet. */}
        <div className="lab-paper-codepeek__body flex-1 overflow-auto">
          {shownFile && (
            <CodeBlock
              code={shown.code}
              softLines={shown.softLines}
              lang="solidity"
              theme="github-light"
              showLineNumbers
            />
          )}
        </div>
      </aside>
    </>
  );
};
