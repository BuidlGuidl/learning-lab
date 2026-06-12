// defineLab — derives the runtime Lab from a lab directory's pieces.
//
// Authors hand it the marked contracts (snapshotted from contracts/*.sol)
// and the chapters; it extracts segments + regions and validates that every
// code-exercise card points at a region that exists. A bad reference throws
// at module load, so the mistake surfaces in dev and in validate-labs,
// never in a learner session.
import type { DeployFn, LabTests } from "./harness";
import { extractLabContracts } from "./regions";
import type { Chapter, Lab } from "./types";

export type LabSpec = {
  id: string;
  title: string;
  // marked .sol sources, keyed by filename (generated from contracts/ by
  // scripts/gen-lab-sources.mjs)
  contracts: Record<string, string>;
  deploy: DeployFn;
  tests: LabTests;
  chapters: Chapter[];
};

export function defineLab(spec: LabSpec): Lab {
  const { files, regions } = extractLabContracts(spec.contracts);

  for (const chapter of spec.chapters) {
    for (const card of chapter.cards) {
      if (card.type === "code-exercise" && !regions[card.region]) {
        throw new Error(`lab "${spec.id}": card "${card.id}" references unknown region "${card.region}"`);
      }
      if (card.type === "code" && !files[card.file]) {
        throw new Error(`lab "${spec.id}": card "${card.id}" reveals unknown file "${card.file}"`);
      }
      if (card.type === "experiment" && card.component == null) {
        throw new Error(`lab "${spec.id}": experiment card "${card.id}" has no component`);
      }
    }
  }

  return {
    id: spec.id,
    title: spec.title,
    files,
    regions,
    deploy: spec.deploy,
    tests: spec.tests,
    chapters: spec.chapters,
  };
}
