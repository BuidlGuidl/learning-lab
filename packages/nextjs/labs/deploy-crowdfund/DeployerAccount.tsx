"use client";

import { makeIllustration } from "../ethereum-101/assets/Illustration";

export const DeployerAccount = makeIllustration({
  src: "/deployer-account-flow-v2.png",
  width: 1672,
  height: 941,
  alt: "Two deployment paths: a pre-funded browser account signs a deployment in the lab's browser sandbox; your wallet, funded with ETH for gas, signs a deployment on a testnet or mainnet. In both paths, the key stays with the account.",
});
