// Behavioural tests per region. The key is the region id in
// contracts/Crowdfund.sol — that's the whole attribution story.
// These exact functions run in validate-labs (against the canonical contract)
// and at grade time (against the learner's fill).
import { decodeEventLog } from "viem";
import { type LabTests, type World, expect, expectEq, expectOk, expectRevert, test } from "~~/lib/lab/harness";

// decode a write's logs against the contract's own abi; undecodable logs are skipped
const decodedEvents = (logs: { topics: `0x${string}`[]; data: `0x${string}` }[] | undefined, abi: unknown[]) =>
  (logs ?? []).flatMap(log => {
    try {
      return [decodeEventLog({ abi: abi as never, topics: log.topics as never, data: log.data })];
    } catch {
      return [];
    }
  });

// tevm's mine() sets block.timestamp to real system time (Date.now/1000).
// evm_increaseTime / anvil_setBlockTimestampInterval are not implemented in
// this version of tevm, so we use tevmMine({ blockCount: 2, interval }) —
// the second block lands at now + interval, which clears the 7-day deadline.
const EIGHT_DAYS_S = 8 * 24 * 60 * 60;
const passDeadline = async (client: World["client"]) => {
  const mine = client.tevmMine as unknown as (p: { blockCount: number; interval: number }) => Promise<void>;
  await mine({ blockCount: 2, interval: EIGHT_DAYS_S });
};

const ETHER = 10n ** 18n;

export const tests: LabTests = {
  goal: [
    test("GOAL is 10 ether", async ({ contracts, read }) => {
      const value = await read(contracts.Crowdfund, "GOAL");
      expectEq(value, 10n * ETHER, "GOAL");
    }),
    test("GOAL is readable without a transaction", async ({ contracts, read }) => {
      // pure read — no write needed; confirms the constant is publicly accessible
      const value = await read(contracts.Crowdfund, "GOAL");
      expect(typeof value === "bigint", `GOAL should be a uint256, got ${typeof value}`);
      expect((value as bigint) > 0n, "GOAL should be positive");
    }),
  ],

  contributions: [
    test("contributions starts at 0 for any address", async ({ contracts, read, accounts }) => {
      const value = await read(contracts.Crowdfund, "contributions", [accounts[1]]);
      expectEq(value, 0n, "contributions[accounts[1]] before funding");
    }),
    test("contributions reflects a fund() call", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 1n * ETHER }), "fund(1 ether)");
      const value = await read(contracts.Crowdfund, "contributions", [accounts[1]]);
      expectEq(value, 1n * ETHER, "contributions[accounts[1]] after 1 ether fund");
    }),
  ],

  "fund-body": [
    test("fund() records the contribution", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 3n * ETHER }), "fund(3 ether)");
      const value = await read(contracts.Crowdfund, "contributions", [accounts[1]]);
      expectEq(value, 3n * ETHER, "contributions[accounts[1]] after 3 ether fund");
    }),
    test("two fund() calls from the same account accumulate", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 2n * ETHER }), "fund(2 ether)");
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 3n * ETHER }), "fund(3 ether)");
      const value = await read(contracts.Crowdfund, "contributions", [accounts[1]]);
      expectEq(value, 5n * ETHER, "contributions[accounts[1]] after 2+3 ether");
    }),
    test("fund() emits Funded with contributor and amount", async ({ contracts, write, accounts }) => {
      const tx = await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 2n * ETHER });
      expectOk(tx, "fund(2 ether)");
      const events = decodedEvents(tx.logs, contracts.Crowdfund.abi);
      const funded = events.find(e => e.eventName === "Funded");
      expect(!!funded, "expected a Funded event");
      const args = funded!.args as unknown as Record<string, unknown>;
      expectEq(args["contributor"], accounts[1], "Funded.contributor");
      expectEq(args["amount"], 2n * ETHER, "Funded.amount");
    }),
  ],

  refund: [
    test("refund() reverts while funding is still open", async ({ contracts, write, accounts }) => {
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 1n * ETHER }), "fund(1 ether)");
      expectRevert(await write(contracts.Crowdfund, "refund", { from: accounts[1] }), "refund() before deadline");
    }),
    test("refund pays back and zeroes the ledger after deadline", async ({
      contracts,
      read,
      write,
      accounts,
      client,
    }) => {
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 1n * ETHER }), "fund(1 ether)");

      await passDeadline(client);

      const balanceBefore = await client.getBalance({ address: contracts.Crowdfund.address });

      const tx = await write(contracts.Crowdfund, "refund", { from: accounts[1] });
      expectOk(tx, "refund() after deadline");

      // ledger entry zeroed
      const remaining = await read(contracts.Crowdfund, "contributions", [accounts[1]]);
      expectEq(remaining, 0n, "contributions[accounts[1]] after refund");

      // contract balance fell by exactly 1 ether
      const balanceAfter = await client.getBalance({ address: contracts.Crowdfund.address });
      expectEq(balanceBefore - balanceAfter, 1n * ETHER, "contract balance drop");

      // Refunded event fired
      const events = decodedEvents(tx.logs, contracts.Crowdfund.abi);
      const refunded = events.find(e => e.eventName === "Refunded");
      expect(!!refunded, "expected a Refunded event");
      const args = refunded!.args as unknown as Record<string, unknown>;
      expectEq(args["contributor"], accounts[1], "Refunded.contributor");
      expectEq(args["amount"], 1n * ETHER, "Refunded.amount");
    }),
    test("second refund() after a successful one reverts", async ({ contracts, write, accounts, client }) => {
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 1n * ETHER }), "fund(1 ether)");

      await passDeadline(client);

      expectOk(await write(contracts.Crowdfund, "refund", { from: accounts[1] }), "first refund()");
      expectRevert(await write(contracts.Crowdfund, "refund", { from: accounts[1] }), "second refund()");
    }),
    test("refund() reverts when the goal was reached", async ({ contracts, write, accounts, client }) => {
      // fund exactly 10 ether so the goal is met
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[1], value: 6n * ETHER }), "fund(6 ether)");
      expectOk(await write(contracts.Crowdfund, "fund", { from: accounts[2], value: 4n * ETHER }), "fund(4 ether)");

      await passDeadline(client);

      expectRevert(await write(contracts.Crowdfund, "refund", { from: accounts[1] }), "refund() when goal was reached");
    }),
  ],
};
