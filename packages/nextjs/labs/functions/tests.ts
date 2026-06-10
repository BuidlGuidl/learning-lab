import { type LabTests, expectEq, test } from "~~/lib/lab/harness";

export const tests: LabTests = {
  "add-fn": [
    test("add(2, 3) returns 5", async ({ contracts, read }) => {
      expectEq(await read(contracts.Adder, "add", [2n, 3n]), 5n, "add(2, 3)");
    }),
    test("add works at the top of the range", async ({ contracts, read }) => {
      const big = 2n ** 255n;
      expectEq(await read(contracts.Adder, "add", [big, big - 1n]), big + big - 1n, "add near uint256 max");
    }),
  ],
};
