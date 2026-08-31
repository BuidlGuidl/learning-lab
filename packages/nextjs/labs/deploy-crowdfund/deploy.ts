import type { DeployFn } from "~~/lib/lab/harness";

// The campaign's funding window. tests.ts time-travels past it, so it reads
// this same constant — change the window and the deadline tests follow.
export const FUNDING_WINDOW_S = 7n * 24n * 60n * 60n;

// One campaign with a week-long funding window. Tests that need the deadline
// behind them time-travel with the client instead of redeploying.
export const deploy: DeployFn = async ({ deployContract }) => {
  const crowdfund = await deployContract("Crowdfund", [FUNDING_WINDOW_S]);
  return { Crowdfund: crowdfund };
};
