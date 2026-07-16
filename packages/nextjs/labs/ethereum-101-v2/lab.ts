import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V2 — blank-slate rebuild of the ethereum-101 curriculum.

// TODO: Add marked .sol sources under contracts/ and run `yarn gen:labs` when the first code exercise lands.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v2",
  title: "Ethereum 101 V2",
  overview:
    "Introduces the learner to the basics of Ethereum, what issues is solves, and basic concepts like accounts, wallets, and transactions.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "centralized-banking-issues",
      title: "Issues of centralized banking",
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
    {
      id: "decentralization-solution",
      title: "Decentralization as a solution",
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
    {
      id: "ethereum",
      title: "Ethereum: the world computer",
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
    {
      id: "ether",
      title: "Ether",
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
    {
      id: "accounts",
      title: "Accounts",
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
    {
      id: "wallets",
      title: "Wallets",
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
    {
      id: "transactions-and-gas",
      title: "Transactions and gas",
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
    {
      id: "applications-of-ethereum",
      title: "Applications of Ethereum",
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
