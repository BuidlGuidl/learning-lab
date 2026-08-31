// Behavioural tests per region. The key is the region id in
// contracts/VendingMachine.sol — that's the whole attribution story.
// These exact functions run in validate-labs (against the canonical contract)
// and at grade time (against the learner's fill).
import { PRICE_WEI, STARTING_STOCK } from "./deploy";
import { decodeEventLog } from "viem";
import { type LabTests, expect, expectEq, expectOk, expectRevert, test } from "~~/lib/lab/harness";

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
  price: [
    test("PRICE is 1 ether", async ({ contracts, read }) => {
      const value = await read(contracts.VendingMachine, "PRICE");
      expectEq(value, PRICE_WEI, "PRICE");
    }),
    test("PRICE is readable without a transaction", async ({ contracts, read }) => {
      // pure read — no write needed; confirms the constant is publicly accessible
      const value = await read(contracts.VendingMachine, "PRICE");
      expect(typeof value === "bigint", `PRICE should be a uint256, got ${typeof value}`);
      expect((value as bigint) > 0n, "PRICE should be positive");
    }),
  ],

  stock: [
    test("the machine starts loaded with 5 snacks", async ({ contracts, read }) => {
      const value = await read(contracts.VendingMachine, "stock");
      expectEq(value, STARTING_STOCK, "stock at deploy");
    }),
    test("stock goes down when a snack sells (it is state, not a constant)", async ({
      contracts,
      read,
      write,
      accounts,
    }) => {
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "buy()");
      const value = await read(contracts.VendingMachine, "stock");
      expectEq(value, STARTING_STOCK - 1n, "stock after one sale");
    }),
  ],

  "buy-guards": [
    test('paying less than the price reverts with "wrong coin"', async ({ contracts, write, accounts }) => {
      expectRevert(
        await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI / 2n }),
        "buy() with half the price",
        "wrong coin",
      );
    }),
    test("overpaying is refused too, the coin must be exact", async ({ contracts, write, accounts }) => {
      expectRevert(
        await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI * 2n }),
        "buy() with double the price",
        "wrong coin",
      );
    }),
    test("the exact price buys a snack", async ({ contracts, write, accounts }) => {
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "buy() at PRICE");
    }),
    test('an empty machine reverts with "sold out"', async ({ contracts, write, accounts }) => {
      for (let i = 0n; i < STARTING_STOCK; i++) {
        expectOk(
          await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }),
          `buy #${i + 1n}`,
        );
      }
      expectRevert(
        await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }),
        "buy() when empty",
        "sold out",
      );
    }),
  ],

  "buy-body": [
    test("a sale takes one snack off the shelf", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "buy()");
      const value = await read(contracts.VendingMachine, "stock");
      expectEq(value, STARTING_STOCK - 1n, "stock after one sale");
    }),
    test("the receipt roll remembers each buyer", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "first buy");
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "second buy");
      const mine = await read(contracts.VendingMachine, "purchases", [accounts[1]]);
      expectEq(mine, 2n, "purchases[accounts[1]] after two buys");
      const theirs = await read(contracts.VendingMachine, "purchases", [accounts[2]]);
      expectEq(theirs, 0n, "purchases[accounts[2]] with no buys");
    }),
    test("every sale is announced with a Sold event", async ({ contracts, write, accounts }) => {
      const tx = await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI });
      expectOk(tx, "buy()");
      const events = decodedEvents(tx.logs, contracts.VendingMachine.abi);
      const sold = events.find(e => e.eventName === "Sold");
      expect(!!sold, "expected a Sold event");
      const args = sold!.args as unknown as Record<string, unknown>;
      expectEq(args["buyer"], accounts[1], "Sold.buyer");
      expectEq(args["stockLeft"], STARTING_STOCK - 1n, "Sold.stockLeft");
    }),
  ],

  withdraw: [
    test('a stranger calling withdraw() reverts with "only the owner"', async ({ contracts, write, accounts }) => {
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "buy()");
      expectRevert(
        await write(contracts.VendingMachine, "withdraw", { from: accounts[1] }),
        "withdraw() from a non-owner",
        "only the owner",
      );
    }),
    test("the owner can empty the till", async ({ contracts, write, accounts, client }) => {
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[1], value: PRICE_WEI }), "first sale");
      expectOk(await write(contracts.VendingMachine, "buy", { from: accounts[2], value: PRICE_WEI }), "second sale");

      const tillBefore = await client.getBalance({ address: contracts.VendingMachine.address });
      expectEq(tillBefore, PRICE_WEI * 2n, "till after two sales");

      expectOk(await write(contracts.VendingMachine, "withdraw", { from: accounts[0] }), "withdraw() from the owner");

      const tillAfter = await client.getBalance({ address: contracts.VendingMachine.address });
      expectEq(tillAfter, 0n, "till after withdraw");
    }),
    test('an empty till reverts with "nothing to withdraw"', async ({ contracts, write, accounts }) => {
      expectRevert(
        await write(contracts.VendingMachine, "withdraw", { from: accounts[0] }),
        "withdraw() with no sales",
        "nothing to withdraw",
      );
    }),
  ],
};
