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
    <nav className="w-80 h-full overflow-y-auto border-r border-[color:var(--lab-paper-border-strong)] bg-[var(--lab-paper-surface)] text-[var(--lab-paper-text)]">
      <div className="flex min-h-[82px] items-center justify-between border-b border-[color:var(--lab-paper-border-strong)] px-[22px] py-[18px]">
        <div>
          <p className="m-0 mb-1 text-xs font-bold uppercase leading-tight text-[var(--lab-paper-violet)]">
            learning lab
          </p>
          <p className="m-0 text-base font-black leading-tight text-[var(--lab-paper-text)]">{lab.title}</p>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded border border-[color:var(--lab-paper-border)] bg-[var(--lab-paper-surface)] text-[var(--lab-paper-muted)] hover:border-[color:var(--lab-paper-violet)] hover:text-[var(--lab-paper-violet)]"
          aria-label="Hide chapters"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-1 px-3.5 pt-4 pb-6">
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
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2.5 text-[var(--lab-paper-muted)] hover:bg-[var(--lab-paper-code)] hover:text-[var(--lab-paper-text)] [&::-webkit-details-marker]:hidden">
                  <span
                    className={`grid h-6 w-6 flex-none place-items-center rounded-full font-mono text-xs ${
                      open
                        ? "bg-[var(--lab-paper-violet)] text-white dark:text-[#14111c]"
                        : "bg-[var(--lab-paper-code)] text-[var(--lab-paper-muted)]"
                    }`}
                  >
                    {chapterIndex + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium leading-[1.35]">{chapter.title}</span>
                  <ChevronRightIcon
                    className={`flex-none w-3.5 h-3.5 text-[var(--lab-paper-faint)] transition-transform ${
                      open ? "rotate-90" : ""
                    }`}
                  />
                </summary>

                <ul className="my-1 mb-2.5 ml-6 flex flex-col border-l border-[color:var(--lab-paper-border)]">
                  {chapter.cards.map((card, cardIndex) => {
                    const active = chapterIndex === activeChapterIndex && cardIndex === activeCardIndex;
                    const locked = isPositionAfter({ chapterIndex, cardIndex }, maxReached);
                    return (
                      <li key={card.id}>
                        <button
                          onClick={() => select(chapterIndex, cardIndex)}
                          className={`relative -ml-px flex w-full cursor-pointer items-center gap-2 rounded-r-lg border-l-[3px] px-2.5 py-2 pl-4 text-left text-sm transition-colors ${
                            active
                              ? "border-[color:var(--lab-paper-violet)] bg-[var(--lab-paper-tint)] font-medium text-[var(--lab-paper-text)]"
                              : "border-transparent text-[var(--lab-paper-muted)] hover:bg-[var(--lab-paper-code)] hover:text-[var(--lab-paper-text)]"
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
