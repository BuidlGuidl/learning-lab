// validate-labs — the contract a lab author works against.
//
// For every lab directory it checks, in order:
//   1. contracts.gen.ts is in sync with contracts/*.sol
//   2. the marked contracts parse (markers balanced, ids unique)
//   3. every region is referenced by exactly one code-exercise card
//   4. every region has at least one test, every test key names a real region
//   5. the all-canonical assembly compiles (OZ imports resolve from the
//      vendored map)
//   6. every region's tests pass against the canonical assembly — the lab
//      grades itself before it ever grades a learner
//
// Red here = the lab is incoherent and must not ship. Run:
//   yarn validate-labs
import { type CompileFn, type Compiled } from "../lib/lab/harness";
import { extractLabContracts } from "../lib/lab/regions";
import { runRegionTests } from "../lib/lab/run";
import type { CodeExerciseCard, Lab } from "../lib/lab/types";
import { OZ_SOURCES } from "../lib/solc/oz-sources";
import { resolveSources } from "../lib/solc/resolve-imports";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const here = path.dirname(fileURLToPath(import.meta.url));
const labsRoot = path.resolve(here, "../labs");

// node-side counterpart of the browser worker's compile
const compile: CompileFn = async sources => {
  const input = {
    language: "Solidity",
    sources: resolveSources(sources, OZ_SOURCES),
    settings: {
      optimizer: { enabled: false },
      evmVersion: "shanghai",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors ?? []).filter((e: { severity: string }) => e.severity === "error");
  if (errors.length) {
    throw new Error(
      errors.map((e: { formattedMessage?: string; message: string }) => e.formattedMessage ?? e.message).join("\n"),
    );
  }
  const compiled: Compiled = {};
  for (const file of Object.keys(sources)) {
    for (const [name, def] of Object.entries<{ abi: unknown[]; evm: { bytecode: { object: string } } }>(
      output.contracts?.[file] ?? {},
    )) {
      if (!def.evm.bytecode.object) continue;
      compiled[name] = { abi: def.abi, bytecode: `0x${def.evm.bytecode.object}` as `0x${string}` };
    }
  }
  return compiled;
};

let failures = 0;
const fail = (labId: string, message: string) => {
  failures++;
  console.error(`  ✗ ${labId}: ${message}`);
};

async function validateLab(labId: string) {
  const labDir = path.join(labsRoot, labId);
  const failuresBefore = failures;
  console.log(`\n${labId}`);

  // 1. snapshot in sync with the .sol files
  const contractsDir = path.join(labDir, "contracts");
  const solFiles = fs
    .readdirSync(contractsDir)
    .filter(f => f.endsWith(".sol"))
    .sort();
  const fromDisk = Object.fromEntries(solFiles.map(f => [f, fs.readFileSync(path.join(contractsDir, f), "utf8")]));
  const { contracts } = (await import(path.join(labDir, "contracts.gen.ts"))) as {
    contracts: Record<string, string>;
  };
  const stale =
    JSON.stringify(fromDisk) !== JSON.stringify(contracts)
      ? "contracts.gen.ts is stale — run: node scripts/gen-lab-sources.mjs"
      : null;
  if (stale) return fail(labId, stale);
  console.log(`  ✓ contracts.gen.ts in sync (${solFiles.join(", ")})`);

  // 2. markers parse
  const { regions } = extractLabContracts(contracts);
  const regionIds = Object.keys(regions);
  console.log(`  ✓ ${regionIds.length} region(s): ${regionIds.join(", ")}`);

  // 3. region ↔ card cross-check
  const { lab } = (await import(path.join(labDir, "lab.ts"))) as { lab: Lab };
  const exerciseRegions = lab.chapters
    .flatMap(c => c.cards)
    .filter((c): c is CodeExerciseCard => c.type === "code-exercise")
    .map(c => c.region);
  for (const id of regionIds) {
    const count = exerciseRegions.filter(r => r === id).length;
    if (count !== 1) fail(labId, `region "${id}" referenced by ${count} code-exercise cards (want exactly 1)`);
  }
  if (failures > failuresBefore) return;
  console.log(`  ✓ every region referenced by exactly one code-exercise card`);

  // 4. tests cover regions, keys are real (off the lab object — single source)
  const { tests, deploy } = lab;
  for (const key of Object.keys(tests)) {
    if (!regions[key]) fail(labId, `tests.ts key "${key}" names no region`);
  }
  for (const id of regionIds) {
    if (!tests[id]?.length) fail(labId, `region "${id}" has no tests`);
  }
  if (failures > failuresBefore) return;
  console.log(`  ✓ every region has tests, every test key is a region`);

  // 5 + 6. canonical assembly compiles and passes every region's tests
  const { files } = extractLabContracts(contracts);
  for (const id of regionIds) {
    const report = await runRegionTests({ files, regions, deploy, tests, compile, regionId: id });
    if (report.verdict === "fail") {
      const detail =
        report.stage === "compile"
          ? report.errors.join("\n")
          : report.results
              .filter(r => !r.passed)
              .map(r => `${r.name}: ${r.error}`)
              .join("; ");
      fail(labId, `canonical run of region "${id}" failed — ${detail}`);
    } else {
      console.log(`  ✓ ${id}: ${report.results.map(r => r.name).join(" · ")}`);
    }
  }
}

async function main() {
  const labIds = fs
    .readdirSync(labsRoot)
    .filter(d => fs.existsSync(path.join(labsRoot, d, "contracts")))
    .sort();

  for (const labId of labIds) await validateLab(labId);

  if (failures) {
    console.error(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log(`\nall ${labIds.length} lab(s) valid`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
