import type { Lab } from "~~/lib/lab/types";

type LabEntry = {
  title: string;
  cardCount: number;
  load: () => Promise<{ lab: Lab }>;
};

// Single source of truth for which labs exist. Adding a lab = add one
// folder under labs/ + one entry here. Routing, the home picker, and
// the store stay agnostic to specific lab ids.
export const registry: Record<string, LabEntry> = {
  "ethereum-101": {
    title: "Ethereum 101",
    cardCount: 23,
    load: () => import("./ethereum-101/lab"),
  },
  tokenization: {
    title: "Tokenization",
    cardCount: 27,
    load: () => import("./tokenization/lab"),
  },
};
