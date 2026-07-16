import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V2 — blank-slate rebuild of the ethereum-101 curriculum.

// TODO: Add marked .sol sources under contracts/ and run `yarn gen:labs` when the first code exercise lands.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v2",
  title: "Ethereum 101 V2",
  overview: "The next iteration of Ethereum 101, under construction.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "start-here",
      title: "Start here",
      cards: [
        {
          type: "concept",
          id: "blank-slate",
          label: "CONCEPT",
          title: "101-v2",
          body: "body",
        },
      ],
    },
  ],
});
