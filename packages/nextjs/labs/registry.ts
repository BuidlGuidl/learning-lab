import type { Lab } from "~~/lib/lab/types";

type LabEntry = {
  title: string;
  slug?: string;
  load: () => Promise<{ lab: Lab }>;
};

// Keys are stable lab ids used by grading and saved progress. An optional slug
// changes the public URL without moving a learner's answers to a different lab.
// Single source of truth for which labs exist. Adding a lab = add one
// folder under labs/ + one entry here. Routing, the home picker, and
// the store stay agnostic to specific lab ids.
export const registry: Record<string, LabEntry> = {
  "ethereum-101": {
    title: "Demo",
    slug: "demo",
    load: () => import("./ethereum-101/lab"),
  },
  "ethereum-101-v2": {
    title: "Ethereum 101",
    slug: "ethereum-101",
    load: () => import("./ethereum-101-v2/lab"),
  },
  // Under construction, not linked from home. Reach it at /labs/crowdfunding.
  crowdfunding: {
    title: "Crowdfunding Contract",
    load: () => import("./deploy-crowdfund/lab"),
  },
  // Under construction, intentionally not linked from home.
  wallets: {
    title: "Wallets",
    load: () => import("./wallets/lab"),
  },
};

export const getLabSlug = (labId: string): string => registry[labId]?.slug ?? labId;

export const getLabIdBySlug = (slug: string): string | undefined =>
  Object.keys(registry).find(labId => getLabSlug(labId) === slug);
