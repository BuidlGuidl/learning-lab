/// <reference lib="webworker" />
// Compiles a single self-contained Solidity source in the browser.
//
// soljson is fetched once from the official binaries CDN; subsequent compiles
// reuse it. The compiler version is pinned so bytecode + ABI are reproducible.
import wrapper from "solc/wrapper";

const SOLJSON_URL = "https://binaries.soliditylang.org/bin/soljson-v0.8.24+commit.e11b9ed9.js";

declare const self: DedicatedWorkerGlobalScope;

self.importScripts(SOLJSON_URL);

const compiler = wrapper((self as unknown as { Module: unknown }).Module);

type CompileRequest = { id: string; source: string };

type CompiledContract = { name: string; abi: unknown[]; bytecode: `0x${string}` };

type CompileSuccess = {
  id: string;
  ok: true;
  abi: unknown[];
  bytecode: `0x${string}`;
  contracts: Record<string, CompiledContract>;
  warnings: string[];
};

type CompileFailure = { id: string; ok: false; errors: string[] };

const SOURCE_FILE = "Contract.sol";

self.onmessage = (event: MessageEvent<CompileRequest>) => {
  const { id, source } = event.data;

  const input = {
    language: "Solidity",
    sources: { [SOURCE_FILE]: { content: source } },
    settings: {
      optimizer: { enabled: false },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  try {
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

    const contracts: Record<string, CompiledContract> = {};
    const defs = output.contracts?.[SOURCE_FILE] as
      | Record<string, { abi: unknown[]; evm: { bytecode: { object: string } } }>
      | undefined;
    for (const [name, def] of Object.entries(defs ?? {})) {
      const obj = def.evm?.bytecode?.object ?? "";
      if (!obj) continue; // interfaces / abstract contracts have no bytecode
      contracts[name] = { name, abi: def.abi, bytecode: ("0x" + obj) as `0x${string}` };
    }

    const names = Object.keys(contracts);
    if (names.length === 0) {
      self.postMessage({
        id,
        ok: false,
        errors: ["compilation produced no deployable contracts"],
      } satisfies CompileFailure);
      return;
    }

    const first = contracts[names[0]];
    self.postMessage({
      id,
      ok: true,
      abi: first.abi,
      bytecode: first.bytecode,
      contracts,
      warnings,
    } satisfies CompileSuccess);
  } catch (err) {
    self.postMessage({ id, ok: false, errors: [(err as Error).message] } satisfies CompileFailure);
  }
};
