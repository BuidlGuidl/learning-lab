import type { DeployFn } from "~~/lib/lab/harness";

export const deploy: DeployFn = async ({ deployContract }) => {
  const adder = await deployContract("Adder");
  return { Adder: adder };
};
