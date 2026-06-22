"use client";

import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { CubeTransparentIcon } from "@heroicons/react/24/outline";
import type { ConceptCard as ConceptCardType } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: ConceptCardType;
};

export const ConceptCard = ({ card }: Props) => {
  // Visuals live inline, below the prose: static illustrations first, then — if
  // the card ships an interactive widget — a button that opens it in the side
  // rail (see InteractivePanel / Lab). The button just toggles the shared store
  // flag the rail reads; the widget itself never renders in the card body. When
  // the card has an illustration the button overlays its top-right corner;
  // otherwise it falls back to a standalone button under the prose.
  const illustrations = card.illustrations ?? [];
  const hasInteractive = Boolean(card.interactive);
  const interactiveOpen = useLabStore(s => s.interactiveOpen);
  const setInteractiveOpen = useLabStore(s => s.setInteractiveOpen);

  const interactiveButton = (overlay: boolean) => (
    <button
      type="button"
      className={`btn btn-sm gap-2 font-mono text-xs text-lab-text hover:border-lab-violet hover:text-lab-violet ${
        overlay
          ? "absolute right-0 top-0 z-10 border-lab-border bg-lab-surface/90 shadow-sm backdrop-blur"
          : "mt-6 self-start border-lab-border bg-transparent"
      }`}
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
          <Illustration>{hasInteractive && index === 0 ? interactiveButton(true) : null}</Illustration>
        </div>
      ))}

      {hasInteractive && illustrations.length === 0 && interactiveButton(false)}
    </CardFrame>
  );
};
