"use client";

import { useEffect, useRef, useState } from "react";
import { CardRenderer } from "./CardRenderer";
import { CodeBuildPanel } from "./CodeBuildPanel";
import { InteractivePanel } from "./InteractivePanel";
import { Sidebar } from "./Sidebar";
import { useMediaQuery } from "usehooks-ts";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
  CodeBracketIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { isCardCleared } from "~~/lib/grader/transcript";
import type { Lab as LabType } from "~~/lib/lab/types";
import { warmCompiler } from "~~/lib/solc/solc";
import { loadSnapshot } from "~~/services/store/lab-persistence";
import { type Position, useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: LabType;
};

const DRAWER_ID = "lab-drawer";
const isGradable = (type: string) => type === "code-exercise" || type === "question";

// A saved position is only safe to restore if it still exists — lab content shifts while
// authoring, and an out-of-bounds index would render a blank card. null falls back to the start.
const validPosition = (lab: LabType, pos: Position): Position | null => {
  const chapter = lab.chapters[pos.chapterIndex];
  if (!chapter || pos.cardIndex < 0 || pos.cardIndex >= chapter.cards.length) return null;
  return pos;
};

// The card encoded in ?ch=&card=, validated against the lab. Absent params return null so the
// saved position can take over.
const positionFromUrl = (lab: LabType): Position | null => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("ch") || !params.has("card")) return null;
  const chapterIndex = Number(params.get("ch"));
  const cardIndex = Number(params.get("card"));
  if (!Number.isInteger(chapterIndex) || !Number.isInteger(cardIndex)) return null;
  return validPosition(lab, { chapterIndex, cardIndex });
};

// True only for elements that consume text, so the `c` peek shortcut still fires over toggles.
// The daisyUI theme switcher is an <input type="checkbox">, so "any <input>" would wrongly
// swallow the key — branch on input type instead.
const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === "TEXTAREA" || el.isContentEditable) return true;
  if (el.tagName !== "INPUT") return false;
  const type = (el as HTMLInputElement).type;
  return !["checkbox", "radio", "range", "button", "submit", "reset", "file", "color"].includes(type);
};

export const Lab = ({ lab }: Props) => {
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);
  const transcript = useLabStore(s => s.transcript);
  const init = useLabStore(s => s.init);
  const hydrate = useLabStore(s => s.hydrate);
  const goTo = useLabStore(s => s.goTo);
  const next = useLabStore(s => s.next);
  const prev = useLabStore(s => s.prev);
  const skipCard = useLabStore(s => s.skipCard);
  // Interactive peek: a card's widget, opened from its "Open interactive" button (see ConceptCard).
  // Reuses the code panel's overlay mechanics behind .lab--interactive-open; reset on navigation.
  const interactiveOpen = useLabStore(s => s.interactiveOpen);
  const setInteractiveOpen = useLabStore(s => s.setInteractiveOpen);

  const isDesktop = useMediaQuery("(min-width: 1024px)"); // Tailwind's lg, matching the code-peek CSS

  // Chapter rail: open on desktop, a closed overlay drawer on mobile.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Code panel: collapsed until peeked (topbar toggle or `c`); its responsive layout lives behind .lab--code-open.
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);

  useEffect(() => {
    // Read before init: init resets progress/transcript, and the persist subscriber writes that
    // reset to storage — reading after would see the just-cleared blob.
    const snapshot = loadSnapshot(lab.id);
    init(lab);
    // Restore answers/verdicts, then place the learner: a ?ch=&card= in the URL wins so a refresh
    // or shared link reopens that card, else resume the saved position.
    if (snapshot) hydrate(snapshot);
    const target = positionFromUrl(lab) ?? (snapshot ? validPosition(lab, snapshot) : null);
    if (target && (target.chapterIndex !== 0 || target.cardIndex !== 0)) {
      goTo(target.chapterIndex, target.cardIndex);
    }
    // kick off the soljson download (~7MB) now, so the first submit doesn't eat the whole wait
    warmCompiler();
  }, [lab, init, hydrate, goTo]);

  // Mirror the card position into the URL so a refresh or shared link reopens it. replaceState,
  // not push, so Back exits the lab instead of walking cards. Skip the first run — it fires
  // before the restore above has settled the position.
  const positionMirrored = useRef(false);
  useEffect(() => {
    if (!positionMirrored.current) {
      positionMirrored.current = true;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("ch", String(chapterIndex));
    params.set("card", String(cardIndex));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [chapterIndex, cardIndex]);

  // Mirror the rail to the viewport; re-runs only on crossing lg, so a manual toggle sticks within a breakpoint.
  useEffect(() => setSidebarOpen(isDesktop), [isDesktop]);

  // `c` toggles the code panel, Esc closes either peek — global, except while a text field has focus (isEditable).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCodeSheetOpen(false);
        setInteractiveOpen(false);
        return;
      }
      if ((e.key === "c" || e.key === "C") && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target)) {
        e.preventDefault();
        setCodeSheetOpen(open => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setInteractiveOpen]);

  const chapter = lab.chapters[chapterIndex];
  const card = chapter?.cards[cardIndex];

  if (!chapter || !card) return null;

  const totalChapters = lab.chapters.length;
  const totalCards = chapter.cards.length;
  const totalLabCards = lab.chapters.reduce((sum, item) => sum + item.cards.length, 0);
  const hasContracts = Object.keys(lab.files).length > 0;
  // The widget this card opens in the interactive peek, if any (concept/question/summary carry it).
  const currentInteractive = "interactive" in card ? card.interactive : undefined;
  const completedBeforeCurrent = lab.chapters.slice(0, chapterIndex).reduce((sum, item) => sum + item.cards.length, 0);
  const currentLabCard = completedBeforeCurrent + cardIndex + 1;
  const progressPercent = totalLabCards > 0 ? (currentLabCard / totalLabCards) * 100 : 0;
  const atFirstCard = chapterIndex === 0 && cardIndex === 0;
  const atLastCard = chapterIndex === totalChapters - 1 && cardIndex === totalCards - 1;

  // Gate: a gradable card locks forward nav until cleared (pass or skip). prev and
  // the sidebar's free-jump stay open — the gate is only on the Next button.
  const gated = isGradable(card.type) && !isCardCleared(transcript, card.id);

  // On mobile the drawer overlays the lesson, so dismiss it after a jump; on desktop the rail stays put.
  const handleNavigate = () => {
    if (!isDesktop) setSidebarOpen(false);
  };

  return (
    // flex-1 + min-h-0 size the drawer to its slot via flexbox (a percentage h-full
    // can't resolve against main's flex-grow height). The drawer-side override below
    // then caps daisyUI's 100vh rail so it fills the slot instead of overflowing.
    <div
      className={`lab flex-1 min-h-0 drawer ${sidebarOpen ? "lg:drawer-open" : ""} ${codeSheetOpen ? "lab--code-open" : ""} ${interactiveOpen ? "lab--interactive-open" : ""}`}
    >
      <input
        id={DRAWER_ID}
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={e => setSidebarOpen(e.target.checked)}
      />

      <div className="lab__content overflow-y-auto drawer-content">
        <div className="mx-auto w-[min(100%,760px)]">
          <section className="min-w-0">
            <div className="w-full max-w-3xl mx-auto shrink-0 relative z-[1] flex items-center justify-between gap-3">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="flex min-w-0 cursor-pointer items-center gap-2 text-sm font-medium text-lab-muted transition-colors hover:text-lab-violet"
                aria-label={sidebarOpen ? "Hide chapters" : "Show chapters"}
              >
                {sidebarOpen ? <ChevronDoubleLeftIcon className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}
                <span className="flex min-w-0 items-center gap-2 text-sm leading-[1.3] text-lab-muted max-md:gap-1.5 max-md:text-[13px] [&_span]:truncate [&_strong]:truncate">
                  <span className="max-md:hidden">{lab.title}</span>
                  <span aria-hidden>›</span>
                  <span>{chapter.title}</span>
                  <span aria-hidden>›</span>
                  <strong className="font-bold text-lab-muted">{card.title}</strong>
                </span>
              </button>
              {hasContracts && (
                <button
                  onClick={() => setCodeSheetOpen(o => !o)}
                  className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-lab-muted transition-colors hover:text-lab-violet"
                  aria-label={codeSheetOpen ? "Hide code" : "Show code"}
                  aria-expanded={codeSheetOpen}
                  aria-controls="lab-code-sheet"
                >
                  <CodeBracketIcon className="w-4 h-4" />
                  <span className="max-md:hidden">code</span>
                  <kbd className="kbd kbd-xs max-md:hidden">c</kbd>
                </button>
              )}
            </div>

            <div className="relative z-[1] mt-2 flex flex-col w-full max-w-3xl gap-6 mx-auto">
              {/* key on card.id remounts the card subtree on every navigation. Without it React
              reuses the same component instance across two same-type cards (e.g. jumping
              exercise→exercise), so the prior card's textarea + grade state leaks in. */}
              <CardRenderer key={card.id} card={card} chapterId={chapter.id} lab={lab} />

              <div className="grid grid-cols-[auto_minmax(72px,1fr)_auto] items-center gap-3 md:grid-cols-[auto_minmax(96px,1fr)_auto] md:gap-4">
                <button
                  className="btn btn-ghost min-h-0 min-w-[72px] gap-2 px-3 text-[15px] leading-none md:min-w-24 md:px-[18px]"
                  onClick={() => prev(lab)}
                  disabled={atFirstCard}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  back
                </button>
                <div
                  className="relative h-1 overflow-hidden rounded bg-lab-track"
                  role="progressbar"
                  aria-label="Lab progress"
                  aria-valuemin={1}
                  aria-valuemax={totalLabCards}
                  aria-valuenow={currentLabCard}
                >
                  <span
                    className="absolute inset-y-0 left-0 min-w-2 rounded bg-lab-violet"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  {gated && (
                    // TODO: (remove-skip) dev-only escape hatch; remove before learner-facing.
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        skipCard(card, chapter.id);
                        next(lab);
                      }}
                    >
                      skip for now
                    </button>
                  )}
                  <button
                    className="btn btn-primary min-h-0 min-w-[72px] gap-2 px-3 text-[15px] leading-none md:min-w-24 md:px-[18px]"
                    onClick={() => next(lab)}
                    disabled={atLastCard || gated}
                  >
                    next
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {gated && <p className="m-0 text-sm text-lab-muted">Pass this card to unlock the next one.</p>}
            </div>
          </section>
        </div>
        {hasContracts && (
          <>
            {/* Backdrop dismisses the mobile sheet; hidden on desktop where the panel sits beside the lesson. */}
            <div className="lab-code-backdrop" onClick={() => setCodeSheetOpen(false)} aria-hidden />

            {/* Positioning wrapper only — not a modal (no focus trap), so the inner <aside> owns the landmark. */}
            <div id="lab-code-sheet" className="lab-code-host">
              {/* Drag handle + close, mobile only (CSS-hidden on desktop, which closes via the toggle or Esc). */}
              <div className="lab-code-sheet__handle">
                <span className="h-1 w-[38px] rounded-full bg-dark-text-faint" aria-hidden />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-lab-muted hover:bg-lab-inset hover:text-lab-text"
                  onClick={() => setCodeSheetOpen(false)}
                  aria-label="Close code"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <CodeBuildPanel lab={lab} />
            </div>
          </>
        )}
        {currentInteractive && (
          <>
            {/* Interactive peek: same overlay mechanics as the code panel, on its own toggle so the code
                panel can still open above it. Opened from the card's "Open interactive" button. */}
            <div className="lab-interactive-backdrop" onClick={() => setInteractiveOpen(false)} aria-hidden />

            <div id="lab-interactive-sheet" className="lab-interactive-host">
              <div className="lab-interactive-sheet__handle">
                <span className="h-1 w-[38px] rounded-full bg-dark-text-faint" aria-hidden />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-lab-muted hover:bg-lab-inset hover:text-lab-text"
                  onClick={() => setInteractiveOpen(false)}
                  aria-label="Close interactive"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <InteractivePanel card={card} Widget={currentInteractive} onClose={() => setInteractiveOpen(false)} />
            </div>
          </>
        )}
      </div>

      <div className="z-20 drawer-side lg:h-full!">
        <label htmlFor={DRAWER_ID} aria-label="close chapters" className="drawer-overlay"></label>
        <Sidebar lab={lab} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
};
