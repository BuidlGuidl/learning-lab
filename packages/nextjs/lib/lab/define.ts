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

  const exerciseCount: Record<string, number> = {};
  for (const chapter of spec.chapters) {
    for (const card of chapter.cards) {
      if (card.type === "code-exercise") {
        if (!regions[card.region]) {
          throw new Error(`lab "${spec.id}": card "${card.id}" references unknown region "${card.region}"`);
        }
        exerciseCount[card.region] = (exerciseCount[card.region] ?? 0) + 1;
      }
      if (card.type === "code" && !files[card.file]) {
        throw new Error(`lab "${spec.id}": card "${card.id}" reveals unknown file "${card.file}"`);
      }
      // an experiment may omit its component — a pure deploy beat is just the
      // console + checks, no surface to mount.
    }
  }

  // exactly one card per region — two cards collapse to one fill in the store,
  // so catch it at load like every other coherence violation, not just in ci
  for (const id of Object.keys(regions)) {
    const count = exerciseCount[id] ?? 0;
    if (count !== 1) {
      throw new Error(
        `lab "${spec.id}": region "${id}" is referenced by ${count} code-exercise cards (want exactly 1)`,
      );
    }
  }

  // a reusesWorld must name an earlier card that shares its world, and a card
  // reusing a world needs a component to mount on it.
  const sharedWorlds = new Set<string>();
  for (const chapter of spec.chapters) {
    for (const card of chapter.cards) {
      if (card.type !== "experiment") continue;
      if (card.sharesWorld && card.reusesWorld) {
        throw new Error(`lab "${spec.id}": card "${card.id}" both shares and reuses a world — pick one`);
      }
      if (card.sharesWorld) sharedWorlds.add(card.id);
      if (card.reusesWorld) {
        if (!sharedWorlds.has(card.reusesWorld)) {
          throw new Error(
            `lab "${spec.id}": card "${card.id}" reuses world "${card.reusesWorld}", which no earlier card shares`,
          );
        }
        if (!card.component) {
          throw new Error(`lab "${spec.id}": card "${card.id}" reuses a world but has no component to mount on it`);
        }
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
