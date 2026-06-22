import { ReadGoal } from "./ReadGoal";
import { UseIt } from "./UseIt";
import { TransactionJourney } from "./assets/TransactionJourney";
import { VendingMachine } from "./assets/VendingMachine";
import { WorldComputer } from "./assets/WorldComputer";
import { Crowdfunding, StateNetwork, TransactionLifecycle, WhatJustHappened } from "./assets/illustrations";
import { contracts } from "./contracts.gen";
import { deploy } from "./deploy";
import { tests } from "./tests";
import { defineLab } from "~~/lib/lab/define";

// Carlos's Ethereum 101 design (issue #20): from "what is Ethereum" to
// deploying and using your own crowdfunding contract.
export const lab = defineLab({
  id: "ethereum-101",
  title: "Ethereum 101",
  overview:
    'Takes the learner from "what is Ethereum" to writing, deploying, and using their own crowdfunding contract, learning real Solidity by doing it in the browser.',
  contracts,
  deploy,
  tests,
  chapters: [
    {
      id: "world-computer",
      title: "A computer no one owns",
      cards: [
        {
          type: "concept",
          id: "the-world-computer",
          label: "CONCEPT",
          title: "The world computer",
          illustrations: [StateNetwork],
          interactive: WorldComputer,
          body: "Most apps you use run on servers owned by a single company.\n**Ethereum is different**, it runs on thousands of independent computers around the world, called **nodes**.\n\nTogether, those nodes act as one shared computer. Every node keeps its own copy of the same record: who owns what, and the **programs** running on the network, called **smart contracts**.\n\nWhen something changes, every node runs the same check on its own copy, and they all agree on a single shared history. The duplicated effort is the point: because everyone verifies the work independently, no one has to trust a central authority.\n\nNo company owns Ethereum, so there is no admin who can block a valid transaction, delete an app, or rewrite history.",
        },
        {
          type: "concept",
          id: "accounts-transactions-gas",
          label: "CONCEPT",
          title: "Interacting with the world computer",
          illustrations: [TransactionLifecycle],
          interactive: TransactionJourney,
          body: "To change something on Ethereum, you need to sign a **transaction** with a local app called a **wallet**. The wallet signs it with your **account**'s **private key**. Never share that key, since anyone with it controls your funds. Other people identify your account by its **address**, a public identifier where they can send you **ETH** (the network's native currency) and other assets.\n\nThe wallet broadcasts your signed transaction to the network, the nodes check it, and if it follows the rules the change is recorded permanently. Transactions are bundled into **blocks**, added one after another to form the **blockchain**.\n\nEvery change also costs **gas**, a small fee in ETH for the network's work. Bigger actions cost more, and you pay even if it fails. The fee also blocks spam, since every action has a cost.",
        },
        {
          type: "question",
          id: "one-company-ethereum",
          label: "QUESTION",
          title: "What if one company owned it?",
          question:
            "Why does it matter that no single person or company is in charge of Ethereum? What would be at risk if someone were?",
          rubricConcepts: [
            "censor users or apps",
            "change the rules unilaterally",
            "single point of failure",
            "everyone is forced to trust the operator",
          ],
          hints: [
            "Think about what your bank or a social platform can already do to your account.",
            "Then go beyond money. What about the rules themselves, and who you'd have to trust?",
          ],
        },
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts",
          illustrations: [VendingMachine],
          body: "A **smart contract** is a program stored on Ethereum. Like a regular user account, a contract has its own address and stores data.\n\nThe classic mental model is a vending machine. You put in the right coin, press a button, and the machine follows its rules. If the payment is valid, it releases the item, with nobody behind the counter deciding whether to serve you.\n\nOnce deployed, a contract's code is public for anyone to read, and it can never be changed.",
        },
      ],
    },
    {
      id: "first-contract",
      title: "Read your first contract",
      cards: [
        {
          type: "concept",
          id: "contracts-are-just-code",
          label: "CONCEPT",
          title: "Contracts are just code",
          body: "Smart contracts are just code, written in a language called **Solidity**. If you have written code before, it will feel familiar. A contract works a lot like a class. It has **state**, the data it remembers between calls, and **functions**, the code that reads or changes it.\n\nHere is a complete contract that keeps a separate count for every address:\n\n```solidity\ncontract Counter {\n  mapping(address => uint256) public count;\n\n  function increment() public {\n    count[msg.sender] += 1;\n  }\n}\n```\n\n`count` is the state, it lives on-chain and survives between transactions. `increment()` is a function anyone can call, and `msg.sender` is whoever sent the transaction. These few pieces are most of what you need to read a real contract.",
        },
        {
          type: "question",
          id: "read-the-counter",
          label: "QUESTION",
          title: "Read the counter",
          question:
            "In the `Counter` contract, calling `increment()` runs a single line:\n\n```solidity\ncount[msg.sender] += 1;\n```\n\n`msg.sender` is the address that called the function. So what does this line do?",
          rubricConcepts: [
            "it looks up the caller's own current number in `count`",
            "adds one to it",
            "and stores the result back, so each address keeps its own independent count",
          ],
          hints: [
            "Read it right to left: `count[msg.sender]` is this caller's own slot. What does `+= 1` do to it?",
            "Different callers have a different `msg.sender`, so whose count goes up when you call `increment()`?",
          ],
        },
        {
          type: "concept",
          id: "what-were-building",
          label: "CONCEPT",
          title: "What we're building",
          illustrations: [Crowdfunding],
          body: "Now that you can read a little Solidity, here is what we are going to build with it: a simple **crowdfunding contract**. It holds ETH and has three rules.\n\n- Contributors can send ETH into the contract.\n- If the campaign reaches its goal, the creator can claim the ETH.\n- If it falls short, contributors can take their money back.\n\nHere's the skeleton we'll start from. The gaps are the pieces you'll fill in yourself over the next few cards, one at a time.\n\n```solidity\ncontract Crowdfund {\n  // GOAL: the funding target (you'll set this)\n  // contributions: a ledger of who sent what (you'll add this)\n\n  function fund() public payable {\n    // record the contribution (you'll write this)\n  }\n\n  function refund() public {\n    // pay contributors back if the goal isn't met (you'll write this)\n  }\n\n  function claim() public {\n    // pay the creator once the goal is reached\n  }\n}\n```\n\nThe interesting part is that no company is running this behind the scenes. The contract follows these rules on its own.",
        },
        {
          type: "code-exercise",
          id: "declare-goal",
          label: "CODE EXERCISE",
          title: "Declare the goal",
          region: "goal",
          prompt:
            "> Hit **peek code** or press `c` any time to see the whole file, your lines filled in and the faded gaps still to come.\n\nEvery campaign needs a target. Declare a constant named `GOAL` set to `10 ether`. The shape is `type visibility constant NAME = value;`: use `uint256`, mark it `public`, and `constant` because the goal never changes after deployment. Solidity understands `ether` as a unit, so `10 ether` means exactly what it says.",
          placeholder: "uint256 public constant FEE = 2 ether;",
          hints: [
            "Follow the placeholder's shape; only the name and value change.",
            "`public` lets anyone read it; `constant` bakes the value in at deploy time.",
            "Write `uint256 public constant GOAL = 10 ether;`. `ether` is a built-in unit, no maths needed.",
          ],
        },
        {
          type: "experiment",
          id: "deploy-goal",
          label: "EXPERIMENT",
          title: "Deploy it",
          scenario:
            "Now make it real. When you press Deploy, your Solidity code is compiled and sent to a fresh Ethereum-like machine running inside this browser tab. That machine is called an **Ethereum Virtual Machine**, or **EVM**.\n\nDeployment is a real transaction. It costs gas, creates a contract address, and lets you read `GOAL` back from the live contract.",
          sharesWorld: true,
          console: "open",
        },
        {
          type: "experiment",
          id: "what-just-happened",
          label: "EXPERIMENT",
          title: "What just happened",
          illustrations: [WhatJustHappened],
          scenario:
            "Your Solidity source was compiled to **bytecode**, and that bytecode is now running on an **EVM** in this tab. On mainnet the exact same bytes would live on every node in the network, and anyone could read the contract's state and verify its source. Open source isn't a virtue bolted on afterwards here. It's the default condition of code on Ethereum.",
          reusesWorld: "deploy-goal",
          component: ReadGoal,
          console: "open",
        },
      ],
    },
    {
      id: "holding-money",
      title: "Contracts can hold money",
      cards: [
        {
          type: "concept",
          id: "eth-is-native",
          label: "CONCEPT",
          title: "Contracts have balance too",
          body: "Money isn't an add-on in Ethereum. Contracts have **balances**, just like accounts do. You already know `msg.sender`, who called a function. Two more pieces complete the picture: `msg.value`, how much ETH came with the call, and `payable`, the keyword a function needs before it will accept ETH at all. `fund()` is built from exactly those three.",
        },
        {
          type: "code-exercise",
          id: "declare-contributions",
          label: "CODE EXERCISE",
          title: "The ledger",
          region: "contributions",
          prompt:
            "The contract needs to remember who sent what, so we want a **ledger**: their address and the amount they sent, one row per contributor. That's the same `mapping(address => uint256)` from the `Counter`, now keyed by contributor instead of counting calls. Declare one named `contributions`, marked `public`. Any address that hasn't contributed just reads zero.",
          placeholder: "mapping(address => uint256) public scores;",
          hints: [
            "Read the type as key then value: the `address` is who contributed, the `uint256` is how much they sent.",
            "Mark it `public` the same way you did with `GOAL`. The placeholder shows the exact shape, just rename it.",
            "Write `mapping(address => uint256) public contributions;`.",
          ],
        },
        {
          type: "concept",
          id: "the-ledger-is-public",
          label: "CONCEPT",
          title: "The ledger is public",
          body: "Anyone can read every row of that mapping: every contribution, every address. Addresses are **pseudonymous**, not private: nobody knows it's you behind 0xab12…, but everything that address does is in the open.\n\n> Privacy on Ethereum is an open frontier the ecosystem is actively building, not a solved problem.",
        },
        {
          type: "code-exercise",
          id: "record-the-funding",
          label: "CODE EXERCISE",
          title: "Record the funding",
          region: "fund-body",
          prompt:
            "> You're only writing the body. Hit **peek code** or press `c` any time to see the current state of the contract, with your work in it.\n\nA contribution has just arrived in the `fund()` function and cleared the `require`s. Two things still need to happen:\n\n1. the ledger has to remember this contributor's new total\n2. the contract should announce that a contribution landed, using the `Funded` event it already declares",
          placeholder: "balances[msg.sender] += msg.value;\nemit Deposited(msg.sender, msg.value);",
          hints: [
            "The ledger is `contributions[address]`. Adding to a running total is `+=`, not `=`.",
            "`Funded` takes who paid and how much, and you already have both in scope: `msg.sender` and `msg.value`.",
            "Write `contributions[msg.sender] += msg.value;` then `emit Funded(msg.sender, msg.value);`.",
          ],
        },
        {
          type: "question",
          id: "why-keep-the-mapping",
          label: "QUESTION",
          title: "Why keep the mapping?",
          question:
            "You just recorded each contribution in `contributions`, keyed by who sent it. The contract also knows `address(this).balance`, the total it holds. Why keep the per-person record when the total is already there?",
          rubricConcepts: [
            "the balance is only a total: it says how much was raised, never who contributed what",
            "a failed campaign has to return each contributor their exact amount, which the total can't give you",
            "the mapping is the per-contributor record the rest of the contract reads, refunds now and accounting later",
          ],
          hints: ["Think back to the deal: what did we promise contributors if the goal isn't reached?"],
        },
      ],
    },
    {
      id: "rules-without-referee",
      title: "Rules without a referee",
      cards: [
        {
          type: "concept",
          id: "require-and-deadlines",
          label: "CONCEPT",
          title: "require and deadlines",
          body: 'Every deal needs someone to enforce it, and here that someone is the contract itself. It has to be able to say no: when a condition isn\'t met, it **reverts** the whole transaction, rolling everything back as if it never happened. The tool for that is `require(condition, "reason")`. Time is a rule too, so the contract reads `block.timestamp` as its clock and holds people to a **deadline** with nobody checking a calendar. Escrow agent and referee in one.',
        },
        {
          type: "code-exercise",
          id: "write-refund",
          label: "CODE EXERCISE",
          title: "Write refund()",
          region: "refund",
          prompt:
            "`refund()` is the deal's other half: if the campaign fell short, each contributor can take their money back. The order of these steps matters, and the next card is about why. Write the body in order:\n\n1. allow the refund only if the deadline has passed and the goal wasn't reached\n2. read the caller's own contribution, and require it's more than zero\n3. zero their row in `contributions`, before any ETH moves\n4. send them their amount, and require the send succeeded\n5. emit `Refunded`",
          placeholder:
            'require(block.timestamp >= deadline, "too early");\nuint256 amount = balances[msg.sender];\nbalances[msg.sender] = 0;\n(bool ok, ) = msg.sender.call{ value: amount }("");\nrequire(ok, "send failed");',
          hints: [
            "The two guards are `block.timestamp >= deadline` and `address(this).balance < GOAL`. Then `uint256 amount = contributions[msg.sender];` and require `amount > 0`.",
            'Sending raw ETH is `(bool ok, ) = msg.sender.call{ value: amount }("")` followed by `require(ok, "send failed")`. That pattern is the one new thing here, the rest you\'ve met.',
            "Order: set `contributions[msg.sender] = 0;` before the `call`, then `emit Refunded(msg.sender, amount);` last.",
          ],
        },
        {
          type: "concept",
          id: "reentrancy",
          label: "CONCEPT",
          title: "Reentrancy, and why code is forever",
          body: "The receiver of ETH can be a contract too, with code that runs the moment the ETH arrives, and that code can call `refund()` again, mid-flight. If `refund()` sent first and zeroed after, those nested calls would each pass the checks and drain everything. That exact bug was TheDAO hack in 2016. Deployed code can't be patched, so the discipline of updating state before external calls, and the audit culture around it, are sacred in Ethereum.",
        },
        {
          type: "question",
          id: "walk-the-attack",
          label: "QUESTION",
          title: "Walk through the attack",
          question:
            "A malicious contract calls `refund()`, and the moment the ETH arrives it calls `refund()` again. Walk through your code: why does the second call get nothing?",
          rubricConcepts: [
            "the contribution was set to zero before any ETH was sent",
            "so when the nested call runs, `contributions[attacker]` is already zero and it fails the `amount > 0` require",
            "updating state before the external call is the general defense, not a quirk of this one contract",
          ],
          hints: ["Follow your lines in order: what is contributions[attacker] by the time the second call runs?"],
        },
      ],
    },
    {
      id: "ship-it",
      title: "Ship it, use it",
      cards: [
        {
          type: "code",
          id: "finished-contract",
          label: "CODE",
          title: "The finished contract",
          file: "Crowdfund.sol",
          note: "The full reveal, every learner line in place, plus `claim()`, the function that pays the creator when the goal is hit. A fixed goal, a public ledger, a deadline, refunds that can't be gamed. The whole deal, enforced by code.",
        },
        {
          type: "experiment",
          id: "ship-final",
          label: "EXPERIMENT",
          title: "Ship it",
          scenario:
            "Deploy the finished contract, your lines and all. Every check you've earned in this lab runs against it on the way in. On mainnet, this exact same deploy would put your crowdfund at an address reachable by anyone on Earth.",
          console: "open",
          sharesWorld: true,
        },
        {
          type: "experiment",
          id: "use-it-like-an-app",
          label: "EXPERIMENT",
          title: "Use it like an app",
          scenario:
            "This is your contract from the outside: an app. Pay into the pool from three browser accounts, then fast-forward the chain past the deadline and watch the deal settle itself. If the campaign fell short, every contributor pulls their own ETH back; if the goal was hit, the creator claims the lot. Nobody signs off on any of it, only the code.",
          component: UseIt,
          reusesWorld: "ship-final",
          console: "closed",
        },
        {
          type: "summary",
          id: "what-you-did",
          label: "SUMMARY",
          title: "You shipped a real contract",
          body: "You read, wrote, and deployed a real smart contract. Along the way: a network nobody owns, accounts and gas, state and mappings, `payable` functions, `require` and deadlines, events, and the reentrancy discipline that separates working Solidity from safe Solidity. The crowdfund you built holds real value and enforces its own rules, no referee needed. That's Ethereum.",
        },
      ],
    },
  ],
});
