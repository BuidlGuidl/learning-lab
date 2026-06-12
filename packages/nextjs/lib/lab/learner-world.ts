"use client";

// Boots the world an experiment card hands its author component. The lab is
// assembled from the learner's ACTUAL fills — whatever they last submitted,
// passing or not — with canonical only for regions they never touched. If
// that assembly doesn't compile, the failure comes back as data, not a
// silent canonical fallback: the learner sees their own compile errors,
// exactly like a real deploy would show them. Running the reference
// solution instead is a separate, explicit choice the shell offers.
import { assembleSources } from "./assemble";
import { type Compiled, type World, bootWorld } from "./harness";
import { latestEvent } from "~~/lib/grader/transcript";
import { compileContracts } from "~~/lib/solc/solc";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

export type LearnerBoot =
  | { ok: true; world: World; reference: boolean }
  // the learner's assembly didn't compile: solc's errors, plus the regions
  // whose fills are learner-written and not currently passing — the suspects
  | { ok: false; errors: string[]; suspects: string[] };

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

export async function bootLearnerWorld(): Promise<LearnerBoot> {
  const { files, regions, deploy, progress, transcript } = useLabStore.getState();
  if (!deploy) throw new Error("lab has no deploy — store not initialised?");

  const result = await compile(assembleSources(files, regions, fillsOf(progress)));
  if (!result.ok) {
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
  return { ok: true, world: await bootWorld(result.compiled, deploy), reference: false };
}

// The explicit escape hatch: deploy the all-canonical reference solution.
// Only offered after the learner's own assembly failed — never silently.
export async function bootReferenceWorld(): Promise<LearnerBoot> {
  const { files, regions, deploy } = useLabStore.getState();
  if (!deploy) throw new Error("lab has no deploy — store not initialised?");

  const result = await compile(assembleSources(files, regions));
  // the validator proves the canonical assembly compiles; failing here is a lab bug
  if (!result.ok) throw new Error(`reference solution failed to compile:\n${result.errors.join("\n")}`);
  return { ok: true, world: await bootWorld(result.compiled, deploy), reference: true };
}
