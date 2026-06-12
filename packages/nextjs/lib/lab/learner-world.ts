"use client";

// Boots the world a card hands its author component — the experiment on
// mount (ADR-0018), the deployment card on the learner's click. The lab is
// assembled with the learner's passed fills (canonical backfill for
// everything skipped, failed, or unreached), compiled in the solc worker,
// deployed to a fresh tevm chain. The third caller of assembleSources —
// grading passes one fill, ci passes none, this passes the passed set.
import { assembleSources } from "./assemble";
import { type CompileFn, type World, bootWorld } from "./harness";
import { compileContracts } from "~~/lib/solc/solc";
import { passedFillsOf, useLabStore } from "~~/services/store/lab-store";

export type WorldBoot = {
  world: World;
  // true when the passed-fills assembly failed to compile and the world is
  // running all-canonical instead — the shell shows a quiet notice
  usedCanonicalFallback: boolean;
};

const compile: CompileFn = async sources => {
  const result = await compileContracts(sources);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return Object.fromEntries(
    Object.entries(result.contracts).map(([name, c]) => [name, { abi: c.abi, bytecode: c.bytecode }]),
  );
};

export async function bootLearnerWorld(): Promise<WorldBoot> {
  const { files, regions, deploy, progress, transcript } = useLabStore.getState();
  if (!deploy) throw new Error("lab has no deploy — store not initialised?");

  try {
    const compiled = await compile(assembleSources(files, regions, passedFillsOf(progress, transcript)));
    return { world: await bootWorld(compiled, deploy), usedCanonicalFallback: false };
  } catch {
    // a fill set that each passed alone can still fail assembled together;
    // free play must not brick on it, so run the reference solution
    const compiled = await compile(assembleSources(files, regions));
    return { world: await bootWorld(compiled, deploy), usedCanonicalFallback: true };
  }
}
