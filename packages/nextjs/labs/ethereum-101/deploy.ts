import type { DeployFn } from "~~/lib/lab/harness";

// One campaign with a week-long funding window. Tests that need the deadline
// behind them time-travel with the client instead of redeploying.
export const deploy: DeployFn = async ({ deployContract }) => {
  const crowdfund = await deployContract("Crowdfund", [7n * 24n * 60n * 60n]);
  return { Crowdfund: crowdfund };
};
