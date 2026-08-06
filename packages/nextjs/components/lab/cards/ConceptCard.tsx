"use client";

import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { CubeTransparentIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type { ConceptCard as ConceptCardType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: ConceptCardType;
};

export const ConceptCard = ({ card }: Props) => {
  // Visuals live inline, below the prose: static illustrations first, then — if
  // the card ships an interactive widget — a button that opens it in the side
  // rail (see InteractivePanel / Lab). The button just toggles the shared store
  // flag the rail reads; the widget itself never renders in the card body. It
  // overlays the top-right corner of the card's first illustration — or of an
  // empty placeholder frame when the card's art hasn't landed yet.
  const illustrations = card.illustrations ?? [];
  const hasInteractive = Boolean(card.interactive);
  const interactiveOpen = useLabStore(s => s.interactiveOpen);
  const setInteractiveOpen = useLabStore(s => s.setInteractiveOpen);

  const interactiveButton = (
    <button
      type="button"
      className="btn btn-sm absolute right-0 top-0 z-10 gap-2 border-lab-border bg-lab-surface font-mono text-xs text-lab-text shadow-sm hover:border-lab-violet hover:text-lab-violet"
      onClick={() => setInteractiveOpen(!interactiveOpen)}
      aria-expanded={interactiveOpen}
    >
      <CubeTransparentIcon className="h-4 w-4" />
      {interactiveOpen ? "Hide interactive" : "Open interactive"}
    </button>
  );

  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text">{card.body}</Markdown>

      {illustrations.map((Illustration, index) => (
        <div key={index} className="mt-7">
          <Illustration>{hasInteractive && index === 0 ? interactiveButton : null}</Illustration>
        </div>
      ))}

      {hasInteractive && illustrations.length === 0 && (
        <div className="relative mt-7 flex aspect-video w-full items-center justify-center rounded-xl border border-lab-border bg-lab-inset">
          <PhotoIcon className="h-10 w-10 text-lab-faint" />
          {interactiveButton}
        </div>
      )}
    </CardFrame>
  );
};
