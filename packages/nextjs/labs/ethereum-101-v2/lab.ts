import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V2 — the next iteration of the Ethereum 101 curriculum, built
// from a blank slate while the current /labs/ethereum-101 stays live. When V2
// is ready it takes over as the canonical 101 (swap the registry entry). Until
// then it's reachable at /labs/ethereum-101-v2 and off the home picker.

// No contracts yet — a blank canvas. Add marked .sol sources under
// contracts/ and run `yarn gen:labs` when the first code exercise lands.
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
