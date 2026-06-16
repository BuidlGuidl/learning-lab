"use client";

import { useEffect, useState } from "react";
import { ChevronRightIcon, LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Lab } from "~~/lib/lab/types";
import { isPositionAfter, useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: Lab;
  // Lab passes this to close the mobile drawer once a card is picked.
  onNavigate?: () => void;
  // Hides the rail entirely (the in-rail close button).
  onClose?: () => void;
};

// The chapter rail: groups the current lab's chapters, each expanding to its cards.
// Pure projection of store position + lab shape — no nav state of its own beyond
// which chapters are expanded.
export const Sidebar = ({ lab, onNavigate, onClose }: Props) => {
  const activeChapterIndex = useLabStore(s => s.chapterIndex);
  const activeCardIndex = useLabStore(s => s.cardIndex);
  const maxReached = useLabStore(s => s.maxReached);
  const goTo = useLabStore(s => s.goTo);

  // Active chapter is always open; a peek into any other stays open until closed.
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([activeChapterIndex]));
  useEffect(() => {
    setExpanded(prev => (prev.has(activeChapterIndex) ? prev : new Set(prev).add(activeChapterIndex)));
  }, [activeChapterIndex]);

  const select = (chapterIndex: number, cardIndex: number) => {
    goTo(chapterIndex, cardIndex);
    onNavigate?.();
  };

  return (
    <nav className="lab-paper-sidebar w-80 h-full overflow-y-auto">
      <div className="lab-paper-sidebar__brand flex items-center justify-between">
        <div>
          <p className="lab-paper-sidebar__kicker">learning lab</p>
          <p className="lab-paper-sidebar__title">{lab.title}</p>
        </div>
        <button onClick={onClose} className="lab-paper-sidebar__close" aria-label="Hide chapters">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <ul className="lab-paper-sidebar__outline flex flex-col gap-1">
        {lab.chapters.map((chapter, chapterIndex) => {
          const open = expanded.has(chapterIndex);
          return (
            <li key={chapter.id}>
              <details
                open={open}
                onToggle={e => {
                  // Read open synchronously — currentTarget is null by the time the updater runs.
                  const isOpen = e.currentTarget.open;
                  setExpanded(prev => {
                    const next = new Set(prev);
                    if (isOpen) next.add(chapterIndex);
                    else next.delete(chapterIndex);
                    return next;
                  });
                }}
              >
                <summary className="lab-paper-sidebar__chapter flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span
                    className={`lab-paper-sidebar__number flex-none grid place-items-center font-mono text-xs ${
                      open ? "is-open" : ""
                    }`}
                  >
                    {chapterIndex + 1}
                  </span>
                  <span className="lab-paper-sidebar__chapter-title flex-1 text-sm font-medium">{chapter.title}</span>
                  <ChevronRightIcon
                    className={`lab-paper-sidebar__chevron flex-none w-3.5 h-3.5 transition-transform ${
                      open ? "rotate-90" : ""
                    }`}
                  />
                </summary>

                <ul className="lab-paper-sidebar__cards flex flex-col">
                  {chapter.cards.map((card, cardIndex) => {
                    const active = chapterIndex === activeChapterIndex && cardIndex === activeCardIndex;
                    const locked = isPositionAfter({ chapterIndex, cardIndex }, maxReached);
                    return (
                      <li key={card.id}>
                        <button
                          onClick={() => select(chapterIndex, cardIndex)}
                          className={`lab-paper-sidebar__card flex items-center w-full gap-2 text-sm text-left cursor-pointer transition-colors ${
                            active
                              ? "is-active font-medium"
                              : "text-base-content/70 hover:text-base-content hover:bg-base-200 hover:border-base-content/20"
                          }`}
                        >
                          <span className="flex-1 truncate">{card.title}</span>
                          {locked && <LockClosedIcon className="flex-none w-3.5 h-3.5 text-base-content/30" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
