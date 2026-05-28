import type { Lab } from "~~/lib/lab/types";

type LabEntry = {
  title: string;
  load: () => Promise<{ lab: Lab }>;
};

// Single source of truth for which labs exist. Adding a lab = add one
// folder under labs/ + one entry here. Routing, the home picker, and
// the store stay agnostic to specific lab ids.
export const registry: Record<string, LabEntry> = {
  basics: {
    title: "Basics of Ethereum",
    load: () => import("./basics/lab"),
  },
  functions: {
    title: "Functions on a contract",
    load: () => import("./functions/lab"),
  },
};
