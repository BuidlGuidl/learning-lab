"use client";

import { useEffect, useState } from "react";
import { CardRenderer } from "./CardRenderer";
import { Sidebar } from "./Sidebar";
import { Bars3Icon, ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
import type { Lab as LabType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  lab: LabType;
};

const DRAWER_ID = "lab-drawer";
const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

export const Lab = ({ lab }: Props) => {
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);
  const init = useLabStore(s => s.init);
  const next = useLabStore(s => s.next);
  const prev = useLabStore(s => s.prev);

  // Rail starts open on desktop, closed on mobile. On desktop it's an in-flow
  // rail that collapses for a focused read; on mobile it's an overlay drawer.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    init(lab);
    if (isDesktop()) setSidebarOpen(true);
  }, [lab, init]);

  const chapter = lab.chapters[chapterIndex];
  const card = chapter?.cards[cardIndex];

  if (!chapter || !card) return null;

  const totalChapters = lab.chapters.length;
  const totalCards = chapter.cards.length;
  const atFirstCard = chapterIndex === 0 && cardIndex === 0;
  const atLastCard = chapterIndex === totalChapters - 1 && cardIndex === totalCards - 1;

  // A pick dismisses the overlay on mobile; on desktop the rail stays put.
  const handleNavigate = () => {
    if (!isDesktop()) setSidebarOpen(false);
  };

  return (
    // flex-1 + min-h-0 size the drawer to its slot via flexbox (a percentage h-full
    // can't resolve against main's flex-grow height). The drawer-side override below
    // then caps daisyUI's 100vh rail so it fills the slot instead of overflowing.
    <div className={`flex-1 min-h-0 drawer ${sidebarOpen ? "lg:drawer-open" : ""}`}>
      <input
        id={DRAWER_ID}
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={e => setSidebarOpen(e.target.checked)}
      />

      <div className="flex flex-col gap-6 px-4 py-6 overflow-y-auto drawer-content">
        {/* Always rendered (no layout jump on toggle); plain + unpadded so it lines
            up with the title's left edge rather than sitting indented like a btn. */}
        <div className="w-full max-w-3xl mx-auto shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="flex items-center gap-1.5 text-sm font-medium cursor-pointer text-base-content/60 hover:text-base-content transition-colors"
            aria-label={sidebarOpen ? "Hide chapters" : "Show chapters"}
          >
            {sidebarOpen ? <ChevronDoubleLeftIcon className="w-4 h-4" /> : <Bars3Icon className="w-4 h-4" />}
            Chapters
          </button>
        </div>

        {/* my-auto centers the reading column in the leftover height, yet still
            scrolls cleanly once the content grows taller than the viewport. */}
        <div className="flex flex-col w-full max-w-3xl gap-6 mx-auto my-auto">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">{lab.title}</h1>
              <span className="text-sm text-base-content/60">
                chapter {chapterIndex + 1} of {totalChapters} · card {cardIndex + 1} of {totalCards}
              </span>
            </div>
            <p className="text-sm text-base-content/60">{chapter.title}</p>
          </div>

          <CardRenderer card={card} />

          <div className="flex justify-between">
            <button className="btn btn-ghost" onClick={() => prev(lab)} disabled={atFirstCard}>
              Prev
            </button>
            <button className="btn btn-primary" onClick={() => next(lab)} disabled={atLastCard}>
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="z-20 drawer-side lg:h-full!">
        <label htmlFor={DRAWER_ID} aria-label="close chapters" className="drawer-overlay"></label>
        <Sidebar lab={lab} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
};
