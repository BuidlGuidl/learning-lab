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

// Ch4 · The private key — one valid key hidden in a vast key space.
export const PrivateKeyKeyspace = makeIllustration({
  src: "/private-key-ch4-3.webp",
  width: 1200,
  height: 675,
  alt: "A learner searches a vast field of hexadecimal private keys while an Ethereum account stays locked, showing that one valid key is hidden among 2^256 possibilities.",
});

// Ch4 · What's safe to share — a high-detail wallet safety infographic.
export const WalletSafetyInfographic = makeIllustration({
  src: "/wallet-safety-infographic-ch4-5.webp",
  width: 1672,
  height: 941,
  unoptimized: true,
  loading: "eager",
  alt: "An infographic titled Public vs Secret: an Ethereum address is safe to share, a private key and recovery phrase must stay secret, every signature should be reviewed, and restoring a wallet is different from sharing its secrets. It also shows common phishing warning signs.",
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
