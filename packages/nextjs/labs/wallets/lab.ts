import { SignMessage } from "./assets/SignMessage";
import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Wallets — the follow-on lab to Ethereum 101. No contracts yet: the cards here
// use a real wallet directly, not the in-browser tevm chain, so the world boots
// empty and there is nothing to grade.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "wallets",
  title: "Wallets",
  overview: "A hands-on tour of Ethereum wallets: what they hold, how they sign, and how to keep them safe.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "signing",
      title: "Signing",
      cards: [
        {
          type: "concept",
          id: "signing-without-a-chain",
          label: "CONCEPT",
          title: "Signing, without a chain",
          interactive: SignMessage,
          body: "This is a simple test of signing a message on a fake local 'chain'.",
        },
      ],
    },
  ],
});
