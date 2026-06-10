// Behavioural tests per region. The key is the region id in
// contracts/Counter.sol — that's the whole attribution story. These exact
// functions run in validate-labs (against the canonical contract) and at
// grade time (against the learner's fill).
import { decodeEventLog } from "viem";
import { type LabTests, expect, expectEq, expectOk, test } from "~~/lib/lab/harness";

// decode a write's logs against the contract's own abi; undecodable logs are skipped
const decodedEvents = (logs: { topics: `0x${string}`[]; data: `0x${string}` }[] | undefined, abi: unknown[]) =>
  (logs ?? []).flatMap(log => {
    try {
      return [decodeEventLog({ abi: abi as never, topics: log.topics as never, data: log.data })];
    } catch {
      return [];
    }
  });

export const tests: LabTests = {
  storage: [
    // the prompt asks for "a starting value", not a specific one — asserting
    // the canonical's 42 would fail a valid answer. The behaviour under test
    // is: a public uint256 getter named number exists and returns a value.
    test("number is publicly readable as a uint256", async ({ contracts, read }) => {
      const value = await read(contracts.Counter, "number");
      expect(typeof value === "bigint", `number() should return a uint256, got ${typeof value}`);
    }),
  ],

  increment: [
    test("increment() bumps number by one", async ({ contracts, read, write }) => {
      const before = (await read(contracts.Counter, "number")) as bigint;
      expectOk(await write(contracts.Counter, "increment"), "increment()");
      const after = (await read(contracts.Counter, "number")) as bigint;
      expectEq(after, before + 1n, "number() after increment");
    }),
  ],

  event: [
    test("NumberChanged fires with the new value", async ({ contracts, write }) => {
      const tx = await write(contracts.Counter, "setNumber", { args: [7n] });
      expectOk(tx, "setNumber(7)");
      const events = decodedEvents(tx.logs, contracts.Counter.abi);
      const hit = events.find(e => e.eventName === "NumberChanged" && Object.values(e.args ?? {})[0] === 7n);
      expect(!!hit, "expected a NumberChanged event carrying 7");
    }),
  ],

  setter: [
    test("setNumber stores the new value", async ({ contracts, read, write }) => {
      expectOk(await write(contracts.Counter, "setNumber", { args: [99n] }), "setNumber(99)");
      expectEq(await read(contracts.Counter, "number"), 99n, "number() after setNumber");
    }),
    test("setNumber announces the change", async ({ contracts, write }) => {
      const tx = await write(contracts.Counter, "setNumber", { args: [123n] });
      expectOk(tx, "setNumber(123)");
      const events = decodedEvents(tx.logs, contracts.Counter.abi);
      const hit = events.find(e => e.eventName === "NumberChanged" && Object.values(e.args ?? {})[0] === 123n);
      expect(!!hit, "expected setNumber to emit NumberChanged with the new value");
    }),
  ],
};
