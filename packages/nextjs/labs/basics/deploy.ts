import type { DeployFn } from "~~/lib/lab/harness";

export const deploy: DeployFn = async ({ deployContract }) => {
  const counter = await deployContract("Counter");
  return { Counter: counter };
};
