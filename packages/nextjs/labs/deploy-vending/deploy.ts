import type { DeployFn } from "~~/lib/lab/harness";

// The machine's canonical numbers. tests.ts and the surfaces read these same
// constants — change the contract and these must follow.
export const PRICE_WEI = 10n ** 18n; // 1 ether
export const STARTING_STOCK = 5n;

// One machine, deployed by accounts[0] — that account is the owner, and every
// surface treats it as "you".
export const deploy: DeployFn = async ({ deployContract }) => {
  const vendingMachine = await deployContract("VendingMachine");
  return { VendingMachine: vendingMachine };
};
