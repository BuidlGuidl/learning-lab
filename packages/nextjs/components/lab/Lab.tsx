"use client";

import { useEffect, useState } from "react";
import { CardRenderer } from "./CardRenderer";
import { CodeBuildPanel } from "./CodeBuildPanel";
import { Sidebar } from "./Sidebar";
import { ArrowLeftIcon, ArrowRightIcon, Bars3Icon, ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
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

  // Rail starts open on desktop, closed on mobile. On desktop it's an in-flow
  // rail that collapses for a focused read; on mobile it's an overlay drawer.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    init(lab);
    if (isDesktop()) setSidebarOpen(true);
    // kick off the soljson download (~7MB) now, so the first submit doesn't eat the whole wait
    warmCompiler();
  }, [lab, init]);

  const chapter = lab.chapters[chapterIndex];
  const card = chapter?.cards[cardIndex];

  if (!chapter || !card) return null;

  const totalChapters = lab.chapters.length;
  const totalCards = chapter.cards.length;
  const totalLabCards = lab.chapters.reduce((sum, item) => sum + item.cards.length, 0);
  const hasContracts = Object.keys(lab.files).length > 0;
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
    <div className={`lab-paper flex-1 min-h-0 drawer ${sidebarOpen ? "lg:drawer-open" : ""}`}>
      <input
        id={DRAWER_ID}
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={e => setSidebarOpen(e.target.checked)}
      />

      <div
        className={`lab-paper__content ${hasContracts ? "lab-paper__content--with-code" : ""} overflow-y-auto drawer-content`}
      >
        <div className={`lab-paper__workspace ${hasContracts ? "lab-paper__workspace--with-code" : ""}`}>
          <section className="lab-paper__lesson-column">
            <div className="lab-paper__topbar w-full max-w-3xl mx-auto shrink-0">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="lab-paper__chapter-toggle flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors"
                aria-label={sidebarOpen ? "Hide chapters" : "Show chapters"}
              >
                {sidebarOpen ? <ChevronDoubleLeftIcon className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}
                <span className="lab-paper__breadcrumb">
                  <span>{lab.title}</span>
                  <span aria-hidden>›</span>
                  <span>{chapter.title}</span>
                  <span aria-hidden>›</span>
                  <strong>{card.title}</strong>
                </span>
              </button>
            </div>

            <div className="lab-paper__main flex flex-col w-full max-w-3xl gap-6 mx-auto">
              {/* key on card.id remounts the card subtree on every navigation. Without it React
              reuses the same component instance across two same-type cards (e.g. jumping
              exercise→exercise), so the prior card's textarea + grade state leaks in. */}
              <CardRenderer key={card.id} card={card} chapterId={chapter.id} lab={lab} />

              <div className="lab-paper__controls flex items-center justify-between">
                <button
                  className="btn btn-ghost lab-paper__nav-button"
                  onClick={() => prev(lab)}
                  disabled={atFirstCard}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  back
                </button>
                <div
                  className="lab-paper__progress-track"
                  role="progressbar"
                  aria-label="Lab progress"
                  aria-valuemin={1}
                  aria-valuemax={totalLabCards}
                  aria-valuenow={currentLabCard}
                >
                  <span className="lab-paper__progress-fill" style={{ width: `${progressPercent}%` }} />
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
                    className="btn btn-primary lab-paper__nav-button"
                    onClick={() => next(lab)}
                    disabled={atLastCard || gated}
                  >
                    next
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {gated && <p className="lab-paper__gate-note text-sm">Pass this card to unlock the next one.</p>}
            </div>
          </section>
        </div>
        {hasContracts && <CodeBuildPanel lab={lab} />}
      </div>

      <div className="z-20 drawer-side lg:h-full!">
        <label htmlFor={DRAWER_ID} aria-label="close chapters" className="drawer-overlay"></label>
        <Sidebar lab={lab} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
};
