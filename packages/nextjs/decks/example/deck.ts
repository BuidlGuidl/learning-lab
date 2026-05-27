import type { Deck } from "~~/lib/deck/types";

const counterSkeleton = `pragma solidity ^0.8.20;

contract Counter {
  __STORAGE__
}
`;

export const deck: Deck = {
  id: "example-basics",
  title: "Basics of Ethereum",
  skeleton: {
    "Counter.sol": counterSkeleton,
  },
  cards: [
    {
      type: "concept",
      id: "what-is-state",
      label: "THE IDEA",
      title: "State lives on chain",
      body: "Every smart contract has state. Storage slots that live on chain, readable by anyone, only writable through the contract's own functions. Before the contract can do anything else, it needs somewhere to keep its data. A state variable is what claims that space.",
    },
    {
      type: "your-turn",
      id: "declare-storage",
      label: "YOUR TURN",
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
      label: "THE CODE",
      title: "Your contract",
      file: "Counter.sol",
      note: "Here's the contract with your line in it. That declaration runs once when the contract gets deployed, and the slot stays there as long as the contract exists.",
    },
  ],
};
