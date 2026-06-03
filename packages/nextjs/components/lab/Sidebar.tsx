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
    <nav className="w-72 h-full overflow-y-auto bg-base-100 border-r border-base-300 p-4">
      <div className="flex items-center justify-between mb-4 pl-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">{lab.title}</p>
        <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle" aria-label="Hide chapters">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-1">
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
                <summary className="flex items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer list-none hover:bg-base-200 [&::-webkit-details-marker]:hidden">
                  <span
                    className={`flex-none grid w-5 h-5 place-items-center rounded-full font-mono text-xs ${
                      open ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/60"
                    }`}
                  >
                    {chapterIndex + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">{chapter.title}</span>
                  <ChevronRightIcon
                    className={`flex-none w-3.5 h-3.5 text-base-content/40 transition-transform ${open ? "rotate-90" : ""}`}
                  />
                </summary>

                <ul className="flex flex-col mt-1 ml-[1.4rem] border-l border-base-300">
                  {chapter.cards.map((card, cardIndex) => {
                    const active = chapterIndex === activeChapterIndex && cardIndex === activeCardIndex;
                    const locked = isPositionAfter({ chapterIndex, cardIndex }, maxReached);
                    return (
                      <li key={card.id}>
                        <button
                          onClick={() => select(chapterIndex, cardIndex)}
                          className={`flex items-center w-full gap-2 py-1.5 pl-4 pr-2 -ml-px text-sm text-left border-l-2 rounded-r-md cursor-pointer transition-colors ${
                            active
                              ? "border-primary bg-primary text-primary-content font-medium"
                              : "border-transparent text-base-content/70 hover:text-base-content hover:bg-base-200 hover:border-base-content/20"
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
