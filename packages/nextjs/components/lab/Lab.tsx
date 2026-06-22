"use client";

import { useEffect, useState } from "react";
import { CardRenderer } from "./CardRenderer";
import { CodeBuildPanel } from "./CodeBuildPanel";
import { InteractivePanel } from "./InteractivePanel";
import { Sidebar } from "./Sidebar";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { isCardCleared } from "~~/lib/grader/transcript";
import type { Lab as LabType } from "~~/lib/lab/types";
import { warmCompiler } from "~~/lib/solc/solc";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: LabType;
};

const DRAWER_ID = "lab-drawer";
const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
const isGradable = (type: string) => type === "code-exercise" || type === "question";

export const Lab = ({ lab }: Props) => {
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);
  const transcript = useLabStore(s => s.transcript);
  const init = useLabStore(s => s.init);
  const next = useLabStore(s => s.next);
  const prev = useLabStore(s => s.prev);
  const skipCard = useLabStore(s => s.skipCard);
  const interactiveOpen = useLabStore(s => s.interactiveOpen);
  const setInteractiveOpen = useLabStore(s => s.setInteractiveOpen);

  // Rail stays closed by default so the learner lands focused on the task; the
  // chapter toggle in the topbar opens it on demand. On desktop it's an in-flow
  // rail, on mobile an overlay drawer.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The code panel is a fixed side rail on desktop; below lg it collapses to a
  // sticky trigger that opens this bottom sheet.
  const [codeSheetOpen, setCodeSheetOpen] = useState(false);
  useEffect(() => {
    init(lab);
    // kick off the soljson download (~7MB) now, so the first submit doesn't eat the whole wait
    warmCompiler();
  }, [lab, init]);

  useEffect(() => {
    if (!codeSheetOpen && !interactiveOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setCodeSheetOpen(false);
      setInteractiveOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [codeSheetOpen, interactiveOpen, setInteractiveOpen]);

  const chapter = lab.chapters[chapterIndex];
  const card = chapter?.cards[cardIndex];

  if (!chapter || !card) return null;

  const totalChapters = lab.chapters.length;
  const totalCards = chapter.cards.length;
  const totalLabCards = lab.chapters.reduce((sum, item) => sum + item.cards.length, 0);
  const hasContracts = Object.keys(lab.files).length > 0;
  const primaryFile = Object.keys(lab.files)[0];
  // The rail hosts one of two things. A reading card (concept / question /
  // summary) that carries its illustration inline gives up the code rail so the
  // column runs full width; if it also ships an interactive widget, the rail
  // returns on demand to host it (toggled from the card, see ConceptCard).
  // Everything else shows the code panel whenever the lab has contracts.
  const isReadingCard = card.type === "concept" || card.type === "question" || card.type === "summary";
  const hasIllustrations = "illustrations" in card && (card.illustrations?.length ?? 0) > 0;
  const currentInteractive = "interactive" in card ? card.interactive : undefined;
  const codeRail = hasContracts && !(isReadingCard && hasIllustrations);
  const interactiveRail = Boolean(currentInteractive) && interactiveOpen;
  const railMode: "interactive" | "code" | null = interactiveRail ? "interactive" : codeRail ? "code" : null;
  const cardHasRail = railMode !== null;
  // Mobile: the code panel hides behind a trigger (codeSheetOpen); the interactive
  // panel is summoned already-open from the card, so its sheet rides interactiveOpen.
  const sheetOpen = railMode === "interactive" ? interactiveOpen : codeSheetOpen;
  const closeRail = () => (railMode === "interactive" ? setInteractiveOpen(false) : setCodeSheetOpen(false));
  const completedBeforeCurrent = lab.chapters.slice(0, chapterIndex).reduce((sum, item) => sum + item.cards.length, 0);
  const currentLabCard = completedBeforeCurrent + cardIndex + 1;
  const progressPercent = totalLabCards > 0 ? (currentLabCard / totalLabCards) * 100 : 0;
  const atFirstCard = chapterIndex === 0 && cardIndex === 0;
  const atLastCard = chapterIndex === totalChapters - 1 && cardIndex === totalCards - 1;

  // Gate: a gradable card locks forward nav until cleared (pass or skip). prev and
  // the sidebar's free-jump stay open — the gate is only on the Next button.
  const gated = isGradable(card.type) && !isCardCleared(transcript, card.id);

  // A pick dismisses the overlay on mobile; on desktop the rail stays put.
  const handleNavigate = () => {
    if (!isDesktop()) setSidebarOpen(false);
  };

  return (
    // flex-1 + min-h-0 size the drawer to its slot via flexbox (a percentage h-full
    // can't resolve against main's flex-grow height). The drawer-side override below
    // then caps daisyUI's 100vh rail so it fills the slot instead of overflowing.
    <div className={`lab flex-1 min-h-0 drawer ${sidebarOpen ? "lg:drawer-open" : ""}`}>
      <input
        id={DRAWER_ID}
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={e => setSidebarOpen(e.target.checked)}
      />

      <div className={`lab__content ${cardHasRail ? "lab__content--with-code" : ""} overflow-y-auto drawer-content`}>
        <div className="mx-auto w-[min(100%,760px)]">
          <section className="min-w-0">
            <div className="w-full max-w-3xl mx-auto shrink-0 relative z-[1]">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="flex max-w-full cursor-pointer items-center gap-2 text-sm font-medium text-lab-muted transition-colors hover:text-lab-violet"
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
        {cardHasRail && (
          <>
            {/* Mobile: sticky bar that opens the code as a bottom sheet. Hidden on desktop, where the panel is a fixed side rail. The interactive panel has no trigger here — it's summoned from the card body. */}
            {railMode === "code" && (
              <button
                type="button"
                className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(56px+env(safe-area-inset-bottom))] items-center gap-2 border-t border-lab-border bg-lab-surface px-4 pb-[env(safe-area-inset-bottom)] font-mono text-[13px] font-semibold text-lab-text shadow-[0_-6px_20px_-10px_rgb(0_0_0/0.25)] min-[900px]:hidden"
                onClick={() => setCodeSheetOpen(true)}
                aria-expanded={codeSheetOpen}
                aria-controls="lab-code-sheet"
              >
                <CodeBracketIcon className="w-4 h-4" />
                <span className="flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">{primaryFile}</span>
                <span className="inline-flex items-center gap-1 text-[11px] uppercase text-lab-violet">
                  view code
                  <ChevronUpIcon className="w-4 h-4" />
                </span>
              </button>
            )}

            <div
              className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-[280ms] min-[900px]:hidden ${
                sheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              onClick={closeRail}
              aria-hidden
            />

            <div
              id="lab-code-sheet"
              className={`lab-code-host fixed inset-x-0 bottom-0 z-50 flex h-[85vh] max-h-[85vh] flex-col overflow-hidden rounded-t-[18px] border-t border-dark-border bg-dark-surface shadow-[0_-16px_48px_-16px_rgb(0_0_0/0.4)] transition-transform duration-[280ms] min-[900px]:static min-[900px]:h-auto min-[900px]:max-h-none min-[900px]:overflow-visible min-[900px]:rounded-none min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:shadow-none ${
                sheetOpen ? "max-[899px]:translate-y-0" : "max-[899px]:translate-y-full"
              }`}
              role="dialog"
              aria-label={railMode === "interactive" ? card.title : "Contract code"}
              aria-modal={sheetOpen || undefined}
            >
              <div className="relative flex shrink-0 items-center justify-center border-b border-dark-border bg-dark-bg px-3 py-2.5 min-[900px]:hidden">
                <span className="h-1 w-[38px] rounded-full bg-dark-text-faint" aria-hidden />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-lab-muted hover:bg-lab-inset hover:text-lab-text"
                  onClick={closeRail}
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {railMode === "interactive" && currentInteractive ? (
                <InteractivePanel card={card} Widget={currentInteractive} onClose={() => setInteractiveOpen(false)} />
              ) : (
                <CodeBuildPanel lab={lab} />
              )}
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
