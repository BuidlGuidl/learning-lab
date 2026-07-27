import type { Lab } from "~~/lib/lab/types";

type LabEntry = {
  title: string;
  load: () => Promise<{ lab: Lab }>;
};

// Single source of truth for which labs exist. Adding a lab = add one
// folder under labs/ + one entry here. Routing, the home picker, and
// the store stay agnostic to specific lab ids.
export const registry: Record<string, LabEntry> = {
  "ethereum-101": {
    title: "Ethereum 101",
    load: () => import("./ethereum-101/lab"),
  },
  // Skeleton of the PR #63 restructure — the OUTLINE.md flow made walkable,
  // info-level drafts instead of final copy. Unlinked tinkering slot,
  // reachable at /labs/ethereum-101-v5.
  "ethereum-101-v5": {
    title: "Ethereum 101 V5",
    load: () => import("./ethereum-101-v5/lab"),
  },
};
