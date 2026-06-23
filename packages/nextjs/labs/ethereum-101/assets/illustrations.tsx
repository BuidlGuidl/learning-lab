"use client";

// The Ethereum 101 static illustrations, each a configured makeIllustration
// instance. They render inline in the card body under the prose (see
// ConceptCard / ExperimentCard); the interactive widgets (WorldComputer,
// TransactionJourney) are separate, opened on demand from the same cards.
import { makeIllustration } from "./Illustration";

// Ch1 · The world computer — a globe of equal nodes, each holding the same copy
// of state, no center and no node larger than the rest.
export const StateNetwork = makeIllustration({
  src: "/nodes-shared-state-ch1-1.png",
  width: 1200,
  height: 800,
  alt: "A globe of many equal nodes connected in a mesh, each node holding the same copy of account state — balance, ownership, contract code — with no center and no node larger than the others.",
});

// Ch1 · Accounts, transactions, gas — a transaction's life from signature to
// permanence.
export const TransactionLifecycle = makeIllustration({
  src: "/transaction-flow-ch1-2.png",
  width: 1200,
  height: 675,
  alt: "A transaction's lifecycle in four steps: you sign it with your key, it is broadcast to the network, a validator includes it in a block, and it becomes a permanent on-chain record.",
});

// Ch2 · The deal — the crowdfunding escrow flow.
export const Crowdfunding = makeIllustration({
  src: "/crowdfunding-workflow-ch2-3.png",
  width: 1200,
  height: 675,
  alt: "Many contributors send ETH to a crowdfunding contract that holds the funds. If the goal is reached the creator is paid; if not, every contributor can reclaim a refund — with no company in the middle.",
});

// Ch3 · The ledger is public — anyone can read every row.
export const PublicLedger = makeIllustration({
  src: "/public-ledger-ch3-3.png",
  width: 1200,
  height: 675,
  alt: "A public ledger panel floating in an open plaza, listing rows of pseudonymous addresses next to the ETH amount each contributed, with pagination — anyone can scroll through and read every entry.",
});
