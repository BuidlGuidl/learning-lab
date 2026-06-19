"use client";

// The right-rail router — the mirror image of CardRenderer for the side panel.
// Given the current card it picks what the rail shows: a card's visual asset
// takes the rail (in place of code), otherwise the code panel renders as it
// always has, and a lab with neither shows nothing.
import { AssetPanel } from "./AssetPanel";
import { CodeBuildPanel } from "./CodeBuildPanel";
import type { Lab } from "~~/lib/lab/types";
import { useLabStore } from "~~/services/store/lab-store";

export const SidePanel = ({ lab }: { lab: Lab }) => {
  const chapterIndex = useLabStore(s => s.chapterIndex);
  const cardIndex = useLabStore(s => s.cardIndex);

  const card = lab.chapters[chapterIndex]?.cards[cardIndex];
  const asset = card && "asset" in card ? card.asset : undefined;

  if (card && asset) return <AssetPanel card={card} Asset={asset} />;
  if (Object.keys(lab.files).length > 0) return <CodeBuildPanel lab={lab} />;
  return null;
};
