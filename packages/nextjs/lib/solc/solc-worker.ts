/// <reference lib="webworker" />
// Compiles a lab's Solidity sources in the browser. Multi-file: the lab's own
// files come in as a map, and their imports (relative or @openzeppelin/...)
// are resolved against the vendored OZ snapshot before solc runs — no
// flattening, no network at compile time.
//
// soljson is fetched once from the official binaries CDN; subsequent compiles
// reuse it. The compiler version is pinned so bytecode + ABI are reproducible.
import { OZ_SOURCES } from "./oz-sources";
import { resolveSources } from "./resolve-imports";
import wrapper from "solc/wrapper";

const SOLJSON_URL = "https://binaries.soliditylang.org/bin/soljson-v0.8.24+commit.e11b9ed9.js";

declare const self: DedicatedWorkerGlobalScope;

self.importScripts(SOLJSON_URL);

const compiler = wrapper((self as unknown as { Module: unknown }).Module);

type CompileRequest = { id: string; sources: Record<string, string> };

type CompiledContract = { name: string; abi: unknown[]; bytecode: `0x${string}` };

type CompileSuccess = {
  id: string;
  ok: true;
  contracts: Record<string, CompiledContract>;
  warnings: string[];
};

type CompileFailure = { id: string; ok: false; errors: string[] };

// the compile pipeline. standard JSON in, deployable contracts out; errors and warnings split by severity.
self.onmessage = (event: MessageEvent<CompileRequest>) => {
  const { id, sources } = event.data;

  try {
    const input = {
      language: "Solidity",
      sources: resolveSources(sources, OZ_SOURCES),
      settings: {
        optimizer: { enabled: false },
        evmVersion: "shanghai",
        outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
      },
    };

    const raw = compiler.compile(JSON.stringify(input));
    const output = JSON.parse(raw);

    const errors: string[] = [];
    const warnings: string[] = [];
    for (const e of output.errors ?? []) {
      if (e.severity === "error") errors.push(e.formattedMessage ?? e.message);
      else warnings.push(e.formattedMessage ?? e.message);
    }
    if (errors.length > 0) {
      self.postMessage({ id, ok: false, errors } satisfies CompileFailure);
      return;
    }

    // only the lab's own files yield deployables — resolved dependencies (OZ)
    // are compilation inputs, not contracts the lab deploys
    const contracts: Record<string, CompiledContract> = {};
    for (const file of Object.keys(sources)) {
      const defs = output.contracts?.[file] as
        | Record<string, { abi: unknown[]; evm: { bytecode: { object: string } } }>
        | undefined;
      for (const [name, def] of Object.entries(defs ?? {})) {
        const obj = def.evm?.bytecode?.object ?? "";
        if (!obj) continue; // interfaces / abstract contracts have no bytecode
        contracts[name] = { name, abi: def.abi, bytecode: ("0x" + obj) as `0x${string}` };
      }
    }

    if (Object.keys(contracts).length === 0) {
      self.postMessage({
        id,
        ok: false,
        errors: ["compilation produced no deployable contracts"],
      } satisfies CompileFailure);
      return;
    }

    self.postMessage({ id, ok: true, contracts, warnings } satisfies CompileSuccess);
  } catch (err) {
    self.postMessage({ id, ok: false, errors: [(err as Error).message] } satisfies CompileFailure);
  }
};
