"use client";

// Boots the world an experiment card hands its surface. The lab is
// assembled from the learner's ACTUAL fills — whatever they last submitted,
// passing or not — with canonical only for regions they never touched, and
// every check earned so far runs against that assembly before the surface
// opens. Grading isolates one region with canonical neighbours (ADR-0015);
// this run is its complement — the one place the learner's regions are
// tested together, on the contract they actually wrote. Failures come back
// as data, never a silent canonical fallback: the learner sees their own
// compile errors or red checks, exactly like a real deploy would show them.
// Running the reference solution instead is a separate, explicit choice.
import { assembleSources } from "./assemble";
import { type Compiled, type World, bootWorld } from "./harness";
import type { TestResult } from "./run";
import type { Lab } from "./types";
import { latestEvent } from "~~/lib/grader/transcript";
import { compileContracts } from "~~/lib/solc/solc";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

// One row of the deploy checklist — a region's test result, with the
// region kept so a red row can name its suspect card.
export type ExperimentCheck = TestResult & { region: string };

export type ExperimentBoot =
  // checks are empty and passed is true on a reference boot — the validator
  // already proves the canonical assembly green, re-running it is theater
  | { ok: true; world: World; checks: ExperimentCheck[]; passed: boolean; reference: boolean }
  // the learner's assembly didn't compile: solc's errors, plus the regions
  // whose fills are learner-written and not currently passing — the suspects
  | { ok: false; errors: string[]; suspects: string[] };

// The regions an experiment checks before its surface opens: those of
// code-exercise cards that come before it in lab order. Future regions stay
// invisible, down to their test names — the ADR-0019 surface rule applied
// to tests.
export function regionsBeforeCard(lab: Lab, cardId: string): string[] {
  const regions: string[] = [];
  for (const chapter of lab.chapters) {
    for (const card of chapter.cards) {
      if (card.id === cardId) return regions;
      if (card.type === "code-exercise") regions.push(card.region);
    }
  }
  return regions;
}

async function compile(
  sources: Record<string, string>,
): Promise<{ ok: true; compiled: Compiled } | { ok: false; errors: string[] }> {
  const result = await compileContracts(sources);
  if (!result.ok) return { ok: false, errors: result.errors };
  return {
    ok: true,
    compiled: Object.fromEntries(
      Object.entries(result.contracts).map(([name, c]) => [name, { abi: c.abi, bytecode: c.bytecode }]),
    ),
  };
}

// Compile the learner's actual assembly; on failure, name the suspects.
async function compileLearnerAssembly(): Promise<
  { ok: true; compiled: Compiled } | { ok: false; errors: string[]; suspects: string[] }
> {
  const { files, regions, progress, transcript } = useLabStore.getState();
  const result = await compile(assembleSources(files, regions, fillsOf(progress)));
  if (result.ok) return result;

  const suspects = Object.entries(progress)
    .filter(([cardId, p]) => {
      const event = latestEvent(transcript, cardId);
      // a skip wrote the canonical into progress — it can't be the culprit
      if (event?.outcome === "skipped") return false;
      return !(event?.outcome === "pass" && event.answer === p.learnerInput);
    })
    .map(([, p]) => p.region);
  return { ok: false, errors: result.errors, suspects };
}

// The experiment's deploy: compile the learner's assembly, run every region
// test earned so far against it, then boot the world the surface gets.
export async function bootExperimentWorld(
  regionIds: string[],
  onProgress?: (done: ExperimentCheck[], total: number) => void,
): Promise<ExperimentBoot> {
  const { deploy, tests } = useLabStore.getState();
  if (!deploy || !tests) throw new Error("lab has no deploy/tests — store not initialised?");

  const result = await compileLearnerAssembly();
  if (!result.ok) return result;

  const suite = regionIds.flatMap(region => (tests[region] ?? []).map(t => ({ region, t })));
  const checks: ExperimentCheck[] = [];
  onProgress?.([], suite.length);
  for (const { region, t } of suite) {
    // fresh chain per test, same bargain as the grade-runner — no test
    // depends on another's state
    try {
      const world = await bootWorld(result.compiled, deploy);
      await t.run(world);
      checks.push({ region, name: t.name, passed: true });
    } catch (e) {
      checks.push({ region, name: t.name, passed: false, error: (e as Error).message });
    }
    onProgress?.([...checks], suite.length);
  }

  const world = await bootWorld(result.compiled, deploy);
  return { ok: true, world, checks, passed: checks.every(c => c.passed), reference: false };
}

// The explicit escape hatch: deploy the all-canonical reference solution.
// Only offered after the learner's own assembly failed — never silently.
export async function bootReferenceWorld(): Promise<ExperimentBoot> {
  const { files, regions, deploy } = useLabStore.getState();
  if (!deploy) throw new Error("lab has no deploy — store not initialised?");

  const result = await compile(assembleSources(files, regions));
  // the validator proves the canonical assembly compiles; failing here is a lab bug
  if (!result.ok) throw new Error(`reference solution failed to compile:\n${result.errors.join("\n")}`);
  return { ok: true, world: await bootWorld(result.compiled, deploy), checks: [], passed: true, reference: true };
}
