"use client";

// The rail host for a card's interactive widget, opened on demand from the card
// body (see ConceptCard's button). Mirrors the code panel's chrome but pins via
// its own .lab-interactive-panel (so the code peek's toggle never moves it), on
// the same desktop side-rail / mobile bottom-sheet. The header carries a desktop
// close button (lg+); below lg the sheet's own drag handle closes it.
import { CubeTransparentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Card } from "~~/lib/lab/types";

type Props = {
  card: Card;
  Widget: React.ComponentType;
  onClose: () => void;
};

export const InteractivePanel = ({ card, Widget, onClose }: Props) => {
  return (
    <aside
      className="lab-interactive-panel box-border flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-dark-surface text-dark-text"
      aria-label={card.title}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dark-border bg-dark-bg px-[18px] py-4">
        <span className="inline-flex items-center gap-2 font-mono text-sm text-dark-text">
          <CubeTransparentIcon className="h-4 w-4 shrink-0 text-violet-bright" />
          Interactive
        </span>
        <button
          type="button"
          className="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] text-dark-text-muted hover:bg-dark-surface hover:text-dark-text lg:inline-flex"
          onClick={onClose}
          aria-label="Close interactive"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-dark-bg p-5">
        <Widget />
      </div>
    </aside>
  );
};
