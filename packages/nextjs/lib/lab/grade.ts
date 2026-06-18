"use client";

// Client-side behavioural grading: the learner's region assembled against
// canonicals, compiled in the solc worker, deployed and tested in tevm —
// all in the browser. The verdict comes out of here; the model only coaches
// on the result.
import { type CompileFn } from "./harness";
import { type RunProgress, type RunReport, runRegionTests } from "./run";
import { compileContracts } from "~~/lib/solc/solc";
import { useLabStore } from "~~/services/store/lab-store";

export type { RunProgress };

export async function gradeRegion(
  regionId: string,
  learnerInput: string,
  onProgress?: (progress: RunProgress) => void,
): Promise<RunReport> {
  const { files, regions, deploy, tests } = useLabStore.getState();
  if (!deploy || !tests) throw new Error("lab has no deploy/tests — store not initialised?");
  // solc's phases fold into the same progress channel as the test loop, so the
  // card narrates one timeline: fetching compiler → compiling → testing.
  const compile: CompileFn = async sources => {
    const result = await compileContracts(sources, phase =>
      onProgress?.(phase === "downloading" ? { step: "fetching-compiler" } : { step: "compiling" }),
    );
    if (!result.ok) throw new Error(result.errors.join("\n"));
    return Object.fromEntries(
      Object.entries(result.contracts).map(([name, c]) => [name, { abi: c.abi, bytecode: c.bytecode }]),
    );
  };
  return runRegionTests({ files, regions, deploy, tests, compile, regionId, learnerInput, onProgress });
}
