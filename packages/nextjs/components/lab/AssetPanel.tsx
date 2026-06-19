"use client";

// The reusable host for a card's visual asset — an interactive, an animation,
// a video. It owns the rail chrome (header + scrollable body) so every asset
// inherits the same frame and responsive behaviour the code panel has; the
// card's component just fills the body. Pinned by the shared .lab-build-panel
// class exactly like CodeBuildPanel, so the desktop side-rail and the mobile
// bottom-sheet host wrap it for free.
import { CubeTransparentIcon } from "@heroicons/react/24/outline";
import type { Card } from "~~/lib/lab/types";

type Props = {
  card: Card;
  Asset: React.ComponentType;
};

export const AssetPanel = ({ card, Asset }: Props) => {
  return (
    <aside
      className="lab-build-panel box-border flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-lab-code-panel-surface text-lab-code-panel-text"
      aria-label={card.title}
    >
      <div className="shrink-0 border-b border-lab-code-panel-border bg-lab-code-panel-head px-[18px] py-4">
        <span className="inline-flex items-center gap-2 font-mono text-sm text-lab-code-panel-text">
          <CubeTransparentIcon className="h-4 w-4 shrink-0 text-lab-code-panel-accent" />
          Interactive
        </span>
      </div>

      <div className="flex-1 overflow-auto bg-lab-code-panel-code p-5">
        <Asset />
      </div>
    </aside>
  );
};
