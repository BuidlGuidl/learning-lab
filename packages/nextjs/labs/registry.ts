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
  // Under construction, intentionally not linked from home until it replaces ethereum-101.
  "ethereum-101-v2": {
    title: "Ethereum 101 V2",
    load: () => import("./ethereum-101-v2/lab"),
  },
  // Curriculum proposal: broad beginner scope with v1's interaction cadence,
  // intentionally unlinked while the team reviews the learner journey.
  "ethereum-101-v3": {
    title: "Ethereum 101 V3",
    load: () => import("./ethereum-101-v3/lab"),
  },
};
