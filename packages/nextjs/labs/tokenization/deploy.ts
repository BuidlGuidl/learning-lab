import type { DeployFn } from "~~/lib/lab/harness";

// Three contracts, no wiring between them at deploy time: the collectible the
// learner builds, and two fixture recipients the tests (and experiments) mint
// against — a vault that can't handle NFTs and a gallery that can. accounts[0]
// deploys, so Ownable(msg.sender) makes it the collection owner.
export const deploy: DeployFn = async ({ deployContract }) => {
  const collectible = await deployContract("YourCollectible");
  const vault = await deployContract("NaiveVault");
  const gallery = await deployContract("FriendlyGallery");
  return { YourCollectible: collectible, NaiveVault: vault, FriendlyGallery: gallery };
};
