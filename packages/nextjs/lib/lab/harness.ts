// The test harness a lab's deploy.ts and tests.ts are written against.
//
// A World is one fresh tevm chain with the lab's contracts deployed. Tests
// get a new world each run, call into it with write/read, and assert with
// the helpers below — throwing is failing. The same functions run in the ci
// validator (node) and at grade time (browser); tevm is isomorphic, so there
// is exactly one copy of every test.
import { type MemoryClient, PREFUNDED_ACCOUNTS, createMemoryClient, encodeDeployData } from "tevm";

export type Address = `0x${string}`;
export type Abi = unknown[];

export type CompiledContract = { abi: Abi; bytecode: `0x${string}` };
export type Compiled = Record<string, CompiledContract>;
// injected per runtime: the browser passes the solc-worker compile, the
// validator passes a node-side solc compile. Throws with solc's formatted
// messages on compile errors.
export type CompileFn = (sources: Record<string, string>) => Promise<Compiled>;

export type ContractHandle = {
  address: Address;
  abi: Abi;
  // populated by deployContract; undefined for handles created elsewhere.
  // bytecode is the deploy tx payload: creation bytecode plus the encoded
  // constructor args — the exact bytes that shipped to the chain.
  deployment?: { gasUsed?: bigint; txHash?: `0x${string}`; bytecode?: `0x${string}` };
};

export type CallResult = {
  data?: unknown;
  errors?: { name?: string; message?: string }[];
  logs?: { address: Address; topics: `0x${string}`[]; data: `0x${string}` }[];
};

export type World = {
  client: MemoryClient;
  accounts: Address[];
  contracts: Record<string, ContractHandle>;
  // state-changing call; reverts come back on result.errors, never thrown,
  // so tests can assert both directions
  write: (
    contract: ContractHandle,
    functionName: string,
    opts?: { args?: unknown[]; from?: Address; value?: bigint },
  ) => Promise<CallResult>;
  read: (contract: ContractHandle, functionName: string, args?: unknown[]) => Promise<unknown>;
};

export type DeployCtx = {
  client: MemoryClient;
  compiled: Compiled;
  accounts: Address[];
  // deploy by compiled contract name; from defaults to accounts[0]
  deployContract: (name: string, args?: unknown[], opts?: { from?: Address }) => Promise<ContractHandle>;
  write: World["write"];
};

// deploy.ts's export: boots the lab's world — deploy order, constructor
// wiring, any seeding — and names the handles tests will use.
export type DeployFn = (ctx: DeployCtx) => Promise<Record<string, ContractHandle>>;

export type LabTest = { name: string; run: (world: World) => Promise<void> };
// tests.ts's export: tests keyed by the region id they validate. Attribution
// is this key — structural, no annotations.
export type LabTests = Record<string, LabTest[]>;

export const test = (name: string, run: (world: World) => Promise<void>): LabTest => ({ name, run });

export async function bootWorld(compiled: Compiled, deploy: DeployFn): Promise<World> {
  const client = createMemoryClient();
  const accounts = (PREFUNDED_ACCOUNTS as unknown as { address: Address }[]).map(a => a.address);

  // tevm's actions are generic over a compile-time abi; ours only exists at
  // runtime (learner-compiled), so the call boundary is typed loosely here
  // and the World surface stays the typed one
  const tevmContract = client.tevmContract as unknown as (p: Record<string, unknown>) => Promise<CallResult>;
  // deploys go through tevmCall, not tevmDeploy: tevm's deployHandler
  // internally forwards the deprecated createTransaction param and warns on
  // every deploy — tevmCall with the same deploy data takes the modern path
  const tevmCall = client.tevmCall as unknown as (
    p: Record<string, unknown>,
  ) => Promise<
    CallResult & { createdAddress?: Address; executionGasUsed?: bigint; totalGasSpent?: bigint; txHash?: `0x${string}` }
  >;

  const write: World["write"] = async (contract, functionName, opts = {}) =>
    tevmContract({
      to: contract.address,
      abi: contract.abi,
      functionName,
      args: opts.args ?? [],
      from: opts.from ?? accounts[0],
      value: opts.value,
      addToBlockchain: true,
      throwOnFail: false,
    });

  const read: World["read"] = async (contract, functionName, args = []) => {
    const result = await tevmContract({
      to: contract.address,
      abi: contract.abi,
      functionName,
      args,
      throwOnFail: false,
    });
    if (result.errors?.length) throw new Error(`read ${functionName} failed: ${result.errors[0].message}`);
    return result.data;
  };

  const deployContract: DeployCtx["deployContract"] = async (name, args = [], opts = {}) => {
    const def = compiled[name];
    if (!def)
      throw new Error(`deploy: no compiled contract named "${name}" (have: ${Object.keys(compiled).join(", ")})`);
    const encodeDeploy = encodeDeployData as unknown as (p: Record<string, unknown>) => `0x${string}`;
    // the literal deploy payload — creation bytecode + encoded constructor args.
    // captured so the console can show the learner the actual bytes that ship.
    const deployData = encodeDeploy({ abi: def.abi, bytecode: def.bytecode, args });
    const result = await tevmCall({
      data: deployData,
      from: opts.from ?? accounts[0],
      addToBlockchain: true,
      throwOnFail: false,
    });
    if (result.errors?.length) throw new Error(`deploy ${name} failed: ${result.errors[0].message}`);
    const gasUsed = result.totalGasSpent ?? result.executionGasUsed;
    return {
      address: result.createdAddress as Address,
      abi: def.abi,
      deployment: { gasUsed, txHash: result.txHash, bytecode: deployData },
    };
  };

  const contracts = await deploy({ client, compiled, accounts, deployContract, write });
  return { client, accounts, contracts, write, read };
}

// ---- assertions: throwing is failing ----

export function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function expectEq(actual: unknown, expected: unknown, label = "value") {
  if (actual !== expected) throw new Error(`expected ${label} to be ${String(expected)}, got ${String(actual)}`);
}

export function expectOk(result: CallResult, label = "call") {
  if (result.errors?.length) throw new Error(`${label} reverted: ${result.errors[0].message ?? result.errors[0].name}`);
}

// Pass `reason` (a substring of the revert message or custom-error name) to
// assert the call reverted *for the expected reason*, not just that it
// reverted at all — a bare revert check passes for an out-of-gas or a
// wrong-require slip and quietly weakens the test.
export function expectRevert(result: CallResult, label = "call", reason?: string) {
  const err = result.errors?.[0];
  if (!err) throw new Error(`${label} should have reverted, but succeeded`);
  if (reason !== undefined) {
    const text = `${err.name ?? ""} ${err.message ?? ""}`;
    if (!text.includes(reason)) {
      throw new Error(`${label} reverted, but not with "${reason}" — got: ${err.message ?? err.name}`);
    }
  }
}
