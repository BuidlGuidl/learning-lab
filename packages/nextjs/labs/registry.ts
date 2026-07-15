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
  // Runs concurrently with ethereum-101 while it's built out. When ready, it
  // takes over as the canonical 101 (point this id's load at the v2 lab, or
  // rename). Off the home picker until then — reach it at /labs/ethereum-101-v2.
  "ethereum-101-v2": {
    title: "Ethereum 101 V2",
    load: () => import("./ethereum-101-v2/lab"),
  },
};
