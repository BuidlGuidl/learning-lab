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
  // Fresh rebuild (issue #59): v1's world-computer opener + v2's centralization
  // copy, ordered like the v3 curriculum. Unlinked tinkering slot, reachable at
  // /labs/ethereum-101-v4.
  "ethereum-101-v4": {
    title: "Ethereum 101 V4",
    load: () => import("./ethereum-101-v4/lab"),
  },
};
