import type { Lab } from "~~/lib/lab/types";

const counterSkeleton = `pragma solidity ^0.8.20;

contract Counter {
  __STORAGE__

  __EVENT__

  __INCREMENT__

  __SETTER__
}
`;

export const lab: Lab = {
  id: "basics",
  title: "Basics of Ethereum",
  skeleton: {
    "Counter.sol": counterSkeleton,
  },
  chapters: [
    {
      id: "state",
      title: "State on chain",
      cards: [
        {
          type: "concept",
          id: "what-is-state",
          label: "CONCEPT",
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
            "Time to declare one. The shape is `type visibility name = value;`. Use `uint256` for an unsigned integer, mark it `public` so anyone can read it from the outside, and give it a starting value. Name it `number`, since the functions you'll write later read and write that exact name and it has to match. The line goes inside the Counter contract, where the __STORAGE__ token sits.",
          placeholder: `string public greeting = "Hello world";`,
          canonical: "uint256 public number = 42;",
        },
        {
          type: "code",
          id: "storage-reveal",
          label: "CODE",
          title: "Your contract",
          file: "Counter.sol",
          note: "Here's the contract with your line in it. That declaration runs once when the contract gets deployed, and the slot stays there as long as the contract exists. The other tokens below are the pieces you'll fill in over the next chapters.",
        },
      ],
    },
    {
      id: "writing",
      title: "Functions that write",
      cards: [
        {
          type: "concept",
          id: "writing-needs-a-tx",
          label: "CONCEPT",
          title: "Changing state takes a transaction",
          body: "Reading a storage slot is one thing. Changing it is another. The only way to write to state is through a function call sent as a transaction, signed by an account, paid for in gas, and mined into a block. That's why a contract's writable surface is exactly its functions, nothing else can reach in and mutate a slot.",
        },
        {
          type: "code-exercise",
          id: "write-increment",
          label: "CODE EXERCISE",
          title: "Write increment()",
          file: "Counter.sol",
          slot: "__INCREMENT__",
          prompt:
            "Write a function called `increment` that bumps `number` up by one. No arguments, no return value. Mark it `public` so anyone can call it. The shape is `function name() visibility { ... }`, and inside, `number += 1;` does the work. This goes where the __INCREMENT__ token sits.",
          placeholder: "function increment() public {\n  number += 1;\n}",
          canonical: "function increment() public {\n  number += 1;\n}",
        },
      ],
    },
    {
      id: "reading",
      title: "Reading is free",
      cards: [
        {
          type: "concept",
          id: "reading-no-tx",
          label: "CONCEPT",
          title: "Reading doesn't need a transaction",
          body: "Because you marked `number` as `public`, Solidity wrote a getter for you, a function also called `number()` that returns the current value. Calling it costs nothing. No transaction, no gas, no block. The node just reads the slot and hands the value back. Reads and writes are charged completely differently, and that split is one of the first things to internalise about Ethereum.",
        },
        {
          type: "concept",
          id: "view-vs-pure",
          label: "CONCEPT",
          title: "view and pure",
          body: "When you write your own read-only functions, two keywords tell the compiler what they're allowed to touch. A `view` function can read state but not change it, the auto-generated getter is effectively one of these. A `pure` function touches no state at all, it works only with its inputs. Both can be called for free from outside, since neither produces a change the chain has to remember.",
        },
      ],
    },
    {
      id: "events",
      title: "Telling the world with events",
      cards: [
        {
          type: "concept",
          id: "what-are-events",
          label: "CONCEPT",
          title: "Events are the contract's receipts",
          body: "State is for what the contract needs to remember. Events are for telling the outside world what just happened. When a function emits an event, it writes a log entry into the transaction's receipt, cheap to store, easy for apps to listen for. Frontends, indexers, and bots watch these logs to react to on-chain activity without polling state on every block.",
        },
        {
          type: "code-exercise",
          id: "declare-event",
          label: "CODE EXERCISE",
          title: "Declare an event",
          file: "Counter.sol",
          slot: "__EVENT__",
          prompt:
            "Declare an event named `NumberChanged` that carries the new value. The shape is `event Name(type paramName);`. Give it one `uint256` parameter, call it `newNumber`. This goes where the __EVENT__ token sits, up near the top with the state, since an event is a declaration, not a function.",
          placeholder: "event NumberChanged(uint256 newNumber);",
          canonical: "event NumberChanged(uint256 newNumber);",
        },
        {
          type: "code-exercise",
          id: "write-setter",
          label: "CODE EXERCISE",
          title: "Emit it from a setter",
          file: "Counter.sol",
          slot: "__SETTER__",
          prompt:
            "Write a function `setNumber` that takes a `uint256 newNumber`, assigns it to `number`, then announces the change with `emit NumberChanged(newNumber);`. Mark it `public`. The `emit` keyword is what fires the log. This goes where the __SETTER__ token sits.",
          placeholder:
            "function setNumber(uint256 newNumber) public {\n  number = newNumber;\n  emit NumberChanged(newNumber);\n}",
          canonical:
            "function setNumber(uint256 newNumber) public {\n  number = newNumber;\n  emit NumberChanged(newNumber);\n}",
        },
        {
          type: "code",
          id: "finished-contract",
          label: "CODE",
          title: "The finished contract",
          file: "Counter.sol",
          note: "That's the whole thing. A slot to remember a number, an event to announce changes, a function to bump it, and one to set it outright. It's small, but every piece here, state, functions, gas, events, is something you'll meet in every contract you ever read.",
        },
      ],
    },
  ],
};
