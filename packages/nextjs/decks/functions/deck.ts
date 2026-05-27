import type { Deck } from "~~/lib/deck/types";

const adderSkeleton = `pragma solidity ^0.8.20;

contract Adder {
  __ADD_FN__
}
`;

export const deck: Deck = {
  id: "functions",
  title: "Functions on a contract",
  skeleton: {
    "Adder.sol": adderSkeleton,
  },
  cards: [
    {
      type: "concept",
      id: "what-is-a-function",
      label: "THE IDEA",
      title: "Functions are how the world talks to your contract",
      body: "A function is the entry point. Anyone with the contract's address can call one, and the contract decides what to do with the inputs. Some functions read state and return values without changing anything. Others mutate storage, emit events, move ETH around. The visibility keyword in the declaration is how you signal which functions the outside world is allowed to call.",
    },
    {
      type: "your-turn",
      id: "write-add",
      label: "YOUR TURN",
      title: "Write a pure adder",
      file: "Adder.sol",
      slot: "__ADD_FN__",
      prompt:
        "A `pure` function reads no state and writes none, just takes inputs and returns outputs. Declare one called `add` that takes two `uint256` arguments and returns their sum. Mark it `public` so callers from outside can hit it, `pure` to promise it doesn't touch storage. The shape is `function name(args) visibility mutability returns (type) { ... }`.",
      placeholder: "function add(uint256 a, uint256 b) public pure returns (uint256) {\n  return a + b;\n}",
      canonical: "function add(uint256 a, uint256 b) public pure returns (uint256) {\n  return a + b;\n}",
    },
    {
      type: "code",
      id: "adder-reveal",
      label: "THE CODE",
      title: "Your contract",
      file: "Adder.sol",
      note: "There's the contract. Any address can call add(2, 3) on it and get 5 back. No gas spent on storage, no events emitted. Pure functions are the cheapest kind because they touch nothing the chain has to remember.",
    },
  ],
};
