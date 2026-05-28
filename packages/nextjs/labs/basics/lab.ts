import type { Lab } from "~~/lib/lab/types";

const counterSkeleton = `pragma solidity ^0.8.20;

contract Counter {
  __STORAGE__
}
`;

export const lab: Lab = {
  id: "basics",
  title: "Basics of Ethereum",
  skeleton: {
    "Counter.sol": counterSkeleton,
  },
  cards: [
    {
      type: "idea",
      id: "what-is-state",
      label: "IDEA",
      title: "State lives on chain",
      body: "Every smart contract has state. Storage slots that live on chain, readable by anyone, only writable through the contract's own functions. Before the contract can do anything else, it needs somewhere to keep its data. A state variable is what claims that space.",
    },
    {
      type: "code-exercise",
      id: "declare-storage",
      label: "CODE EXERCISE",
      title: "Declare a state variable",
      file: "Counter.sol",
      slot: "__STORAGE__",
      prompt:
        "Time to declare one. The shape is `type visibility name = value;`. Use `uint256` for an unsigned integer, mark it `public` so anyone can read it from the outside, and give it a starting value. The line goes inside the Counter contract, where the __STORAGE__ token sits.",
      placeholder: "uint256 public number = 42;",
      canonical: "uint256 public number = 42;",
    },
    {
      type: "code",
      id: "storage-reveal",
      label: "CODE",
      title: "Your contract",
      file: "Counter.sol",
      note: "Here's the contract with your line in it. That declaration runs once when the contract gets deployed, and the slot stays there as long as the contract exists.",
    },
  ],
};
