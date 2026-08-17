"use client";

// The Ethereum 101 v2 static illustrations, each a configured makeIllustration
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

// Ch2 · What people build — examples of applications connected by Ethereum.
export const EthereumUseCases = makeIllustration({
  src: "/ethereum-use-cases-ch2-3.webp",
  width: 1200,
  height: 675,
  alt: "An Ethereum diamond connected to six application examples: payments, loans, a video game item, a digital ticket, identity, and a community treasury with voting.",
});

// Ch3 · Who holds your money — bank custody compared with self-custody.
export const CustodyComparison = makeIllustration({
  src: "/bank-vs-self-custody-ch3-3.webp",
  width: 1200,
  height: 675,
  alt: "A side-by-side comparison of bank custody and Ethereum self-custody: the bank controls access to customer records on one side, while a user holds the key to their Ethereum assets on the other.",
});

// Ch5 · Transactions — a transaction's life from signature to permanence.
export const TransactionLifecycle = makeIllustration({
  src: "/transaction-flow-ch1-2.png",
  width: 1200,
  height: 675,
  alt: "A transaction's lifecycle in four steps: you sign it with your key, it is broadcast to the network, a validator includes it in a block, and it becomes a permanent on-chain record.",
});

// Ch5 · Written in stone — the record is public: anyone can read every row.
export const PublicLedger = makeIllustration({
  src: "/public-ledger-ch3-3.png",
  width: 1200,
  height: 675,
  alt: "A public ledger panel floating in an open plaza, listing rows of pseudonymous addresses next to ETH amounts, with pagination — anyone can scroll through and read every entry.",
});
