import { CounterExperiment } from "./CounterExperiment";
import { FirstDeploy } from "./FirstDeploy";
import { contracts } from "./contracts.gen";
import { deploy } from "./deploy";
import { tests } from "./tests";
import { defineLab } from "~~/lib/lab/define";

export const lab = defineLab({
  id: "basics",
  title: "Basics of Ethereum",
  contracts,
  deploy,
  tests,
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
          region: "storage",
          prompt:
            "Time to declare one. The shape is `type visibility name = value;`. Use `uint256` for an unsigned integer, mark it `public` so anyone can read it from the outside, and give it a starting value. Name it `number`, since the functions you'll write later read and write that exact name and it has to match. The line goes inside the Counter contract, in the first placeholder.",
          placeholder: `string public greeting = "Hello world";`,
        },
        {
          type: "code",
          id: "storage-reveal",
          label: "CODE",
          title: "Your contract",
          file: "Counter.sol",
          note: "Here's the contract with your line in it. That declaration runs once when the contract gets deployed, and the slot stays there as long as the contract exists. The faded lines below are the pieces you'll fill in over the next chapters.",
        },
        {
          type: "deployment",
          id: "first-deploy",
          label: "DEPLOYMENT",
          title: "Deploy it",
          scenario:
            "That contract is real Solidity, and this tab has a real EVM in it. Press deploy: your source gets compiled to bytecode and shipped to a fresh chain, right here, nothing leaves the browser. Then read your storage slot back from the live contract — the value you picked, answering from the chain.",
          component: FirstDeploy,
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
          region: "increment",
          prompt:
            "Write a function called `increment` that bumps `number` up by one. No arguments, no return value. Mark it `public` so anyone can call it. The shape is `function name() visibility { ... }`, and inside, `number += 1;` does the work. This goes in the increment placeholder in the contract.",
          placeholder: "function increment() public {\n  number += 1;\n}",
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
          region: "event",
          prompt:
            "Declare an event named `NumberChanged` that carries the new value. The shape is `event Name(type paramName);`. Give it one `uint256` parameter, call it `newNumber`. This goes up near the top with the state, since an event is a declaration, not a function.",
          placeholder: "event NumberChanged(uint256 newNumber);",
        },
        {
          type: "code-exercise",
          id: "write-setter",
          label: "CODE EXERCISE",
          title: "Emit it from a setter",
          region: "setter",
          prompt:
            "Write a function `setNumber` that takes a `uint256 newNumber`, assigns it to `number`, then announces the change with `emit NumberChanged(newNumber);`. Mark it `public`. The `emit` keyword is what fires the log.",
          placeholder:
            "function setNumber(uint256 newNumber) public {\n  number = newNumber;\n  emit NumberChanged(newNumber);\n}",
        },
      ],
    },
    {
      id: "ownership",
      title: "Who's allowed to call what",
      cards: [
        {
          type: "concept",
          id: "why-ownership",
          label: "CONCEPT",
          title: "Some functions belong to the owner",
          body: "Right now anyone can call anything on Counter. That's fine for reading and even for bumping a number, but most real contracts have actions that should belong to whoever deployed them, like pausing, withdrawing fees, or wiping state. Nobody writes that access control by hand. You import OpenZeppelin's Ownable, audited code that thousands of contracts already run, and inherit from it. Look at the contract: the import line at the top pulls it in, `contract Counter is Ownable` mixes it in, and `constructor() Ownable(msg.sender)` tells it the deployer is the owner. From then on, any function you mark with the `onlyOwner` modifier rejects every other caller before your code even runs.",
        },
        {
          type: "code-exercise",
          id: "write-reset",
          label: "CODE EXERCISE",
          title: "Write an owner-only reset",
          region: "reset",
          prompt:
            "Write a function `reset` that sets `number` back to 0, and make it owner-only by adding the `onlyOwner` modifier after the visibility: `function reset() public onlyOwner { ... }`. You didn't write that modifier, Ownable did, but your function gets the check for free. When it's graded, the tests actually deploy your contract and try to call reset from a stranger's account, so the modifier has to really be there.",
          placeholder: "function reset() public onlyOwner {\n  number = 0;\n}",
        },
        {
          type: "code",
          id: "finished-contract",
          label: "CODE",
          title: "The finished contract",
          file: "Counter.sol",
          note: "That's the whole thing. A slot to remember a number, an event to announce changes, functions to change it, and an owner-only reset guarded by code you imported instead of wrote. Every piece here, state, functions, gas, events, access control, shows up in every contract you'll read from now on.",
        },
        {
          type: "experiment",
          id: "drive-your-counter",
          label: "EXPERIMENT",
          title: "Drive your counter",
          scenario:
            "This is your contract, compiled and deployed to a throwaway chain right here in the browser. Nothing to pass, nothing graded — just drive it. Bump the number from a few different accounts, set it directly and watch your NumberChanged event land in the log. Then the real test of the chapter: call reset() as the owner, and call it again as a stranger. One of those goes through and one gets rejected by the modifier you wrote — see it happen for real.",
          component: CounterExperiment,
        },
      ],
    },
  ],
});
