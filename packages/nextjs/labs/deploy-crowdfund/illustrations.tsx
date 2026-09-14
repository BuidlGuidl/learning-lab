"use client";

import { makeIllustration } from "../ethereum-101-v2/assets/Illustration";

export const PublicLedger = makeIllustration({
  src: "/public-ledger-ch3-3.png",
  width: 1200,
  height: 675,
  alt: "A public ledger lists addresses and their ETH contributions. Anyone can read the entries.",
});

export const Reentrancy = makeIllustration({
  src: "/reentrancy-ch4-3.png",
  width: 1200,
  height: 675,
  alt: "A vulnerable refund sends ETH before clearing the contribution. The receiver calls refund again before the first call finishes and receives another payment.",
});

export const CrowdfundOverview = makeIllustration({
  src: "/deploy-crowdfund/overview.webp",
  width: 1200,
  height: 675,
  alt: "Contributors send ETH to a crowdfunding contract. After the deadline, the creator can request a payout if the goal is reached. Otherwise, contributors can request their own refunds.",
});

export const ContractDeployment = makeIllustration({
  src: "/deploy-crowdfund/deployment-wide.webp",
  width: 1200,
  height: 438,
  alt: "Solidity source passes through a compiler to produce deployment bytecode. A deployment transaction creates a contract in the browser EVM, where the funding goal can be read.",
});

export const ContractBalance = makeIllustration({
  src: "/deploy-crowdfund/contract-balance.webp",
  width: 1200,
  height: 675,
  alt: "A contributor calls the payable fund function with msg.value of 1 ETH. The contract balance increases from 2 ETH to 3 ETH. msg.sender identifies the caller.",
});

export const RefundDeadline = makeIllustration({
  src: "/deploy-crowdfund/deadline.webp",
  width: 1200,
  height: 675,
  alt: "A refund request is blocked before the deadline. After the deadline, a contributor can request their 1 ETH back if the campaign has not reached its 10 ETH goal.",
});
