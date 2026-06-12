import type { DeployFn } from "~~/lib/lab/harness";
import type { Lab } from "~~/lib/lab/types";

type LabEntry = {
  title: string;
  load: () => Promise<{ lab: Lab }>;
  // the deployment card boots its in-tab world with the lab's own deploy fn
  loadDeploy: () => Promise<{ deploy: DeployFn }>;
};

// Single source of truth for which labs exist. Adding a lab = add one
// folder under labs/ + one entry here. Routing, the home picker, and
// the store stay agnostic to specific lab ids.
export const registry: Record<string, LabEntry> = {
  "ethereum-101": {
    title: "Ethereum 101",
    load: () => import("./ethereum-101/lab"),
    loadDeploy: () => import("./ethereum-101/deploy"),
  },
};
