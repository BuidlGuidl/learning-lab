"use client";

// Client-side behavioural grading: the learner's region assembled against
// canonicals, compiled in the solc worker, deployed and tested in tevm —
// all in the browser. The verdict comes out of here; the model only coaches
// on the result (ADR-0009's split, with tests instead of a bare compile).
import { type CompileFn } from "./harness";
import { type RunReport, runRegionTests } from "./run";
import { compileContracts } from "~~/lib/solc/solc";
import { useLabStore } from "~~/services/store/lab-store";

const workerCompile: CompileFn = async sources => {
  const result = await compileContracts(sources);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return Object.fromEntries(
    Object.entries(result.contracts).map(([name, c]) => [name, { abi: c.abi, bytecode: c.bytecode }]),
  );
};

export async function gradeRegion(regionId: string, learnerInput: string): Promise<RunReport> {
  const { files, regions, deploy, tests } = useLabStore.getState();
  if (!deploy || !tests) throw new Error("lab has no deploy/tests — store not initialised?");
  return runRegionTests({ files, regions, deploy, tests, compile: workerCompile, regionId, learnerInput });
}
