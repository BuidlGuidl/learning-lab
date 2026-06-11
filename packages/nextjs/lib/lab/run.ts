// The grade-runner: assemble → compile → deploy → run a region's tests.
//
// One entry point for both consumers. The ci validator calls it with no
// learner input (all-canonical — the lab grading itself) across every region;
// grade time calls it with the learner's fill for the region under test and
// every other region canonical-backfilled (ADR-0015). The verdict comes from
// the tests alone; the canonical is never diffed against the learner.
import { assembleSources } from "./assemble";
import { type CompileFn, type DeployFn, type LabTests, bootWorld } from "./harness";
import type { Region, Segment } from "./regions";

export type TestResult = { name: string; passed: boolean; error?: string };

export type RunReport =
  | { verdict: "fail"; stage: "compile"; errors: string[] }
  | { verdict: "pass" | "fail"; stage: "tests"; results: TestResult[] };

// Live narration of a run, for UIs that want to show progress instead of a
// silent wait. The compiler steps are emitted by whoever wires up `compile`
// (grade.ts maps solc's phases onto this); the testing step is emitted here,
// once up front and again as each test lands.
export type RunProgress =
  | { step: "fetching-compiler" }
  | { step: "compiling" }
  | { step: "testing"; total: number; results: TestResult[] };

export async function runRegionTests(opts: {
  files: Record<string, Segment[]>;
  regions: Record<string, Region>;
  deploy: DeployFn;
  tests: LabTests;
  compile: CompileFn;
  regionId: string;
  learnerInput?: string; // omit to run the region's tests against all-canonical
  onProgress?: (progress: RunProgress) => void;
}): Promise<RunReport> {
  const fills = opts.learnerInput !== undefined ? { [opts.regionId]: opts.learnerInput } : {};
  const sources = assembleSources(opts.files, opts.regions, fills);

  let compiled;
  try {
    compiled = await opts.compile(sources);
  } catch (e) {
    return { verdict: "fail", stage: "compile", errors: [(e as Error).message] };
  }

  const tests = opts.tests[opts.regionId] ?? [];
  const results: TestResult[] = [];
  opts.onProgress?.({ step: "testing", total: tests.length, results: [] });
  for (const t of tests) {
    // fresh chain per test so no test depends on another's state
    try {
      const world = await bootWorld(compiled, opts.deploy);
      await t.run(world);
      results.push({ name: t.name, passed: true });
    } catch (e) {
      results.push({ name: t.name, passed: false, error: (e as Error).message });
    }
    opts.onProgress?.({ step: "testing", total: tests.length, results: [...results] });
  }

  return { verdict: results.every(r => r.passed) ? "pass" : "fail", stage: "tests", results };
}
