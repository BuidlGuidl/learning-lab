import { ReadGoal } from "./ReadGoal";
import { UseIt } from "./UseIt";
import { contracts } from "./contracts.gen";
import { deploy } from "./deploy";
import { tests } from "./tests";
import { defineLab } from "~~/lib/lab/define";

// Carlos's Ethereum 101 design (issue #20): from "what is Ethereum" to
// deploying and using your own crowdfunding contract.
export const lab = defineLab({
  id: "ethereum-101",
  title: "Ethereum 101",
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
          body: "Ethereum is one computer, but it runs on thousands of independent machines, called **nodes**, spread around the world. Every node runs the same programs and agrees on the result. There's no off switch and no admin running it. No one sits in the middle who can block your transactions, rewrite what happened, or change the rules. The whole network working together is the **world computer**, and no single company owns it.",
        },
        {
          type: "concept",
          id: "accounts-transactions-gas",
          label: "CONCEPT",
          title: "Interacting with the world computer",
          body: "You act on the world computer through an **account**, which is really just your identity plus a key only you control. To change anything you sign a **transaction** with that key, broadcast it to the network, and wait for a node to bundle it into a **block** along with everyone else's. Once it lands in a block it's permanent, and nobody can quietly undo it. Every change also costs a small fee called **gas**, paid to the network for the work it does on your behalf. That fee is what stops a shared computer like this from being spammed to death.",
        },
        {
          type: "question",
          id: "one-company-ethereum",
          label: "QUESTION",
          title: "What if one company owned it?",
          question:
            "Imagine a single company owned and ran Ethereum. What power would that give them over you and the apps you use?",
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
          body: "A **smart contract** is a program stored on chain. Its code is public by default, it runs exactly as written, and nobody can take it down. The classic mental model is a vending machine: you put a coin in, it applies its rules, and your item drops out, with nobody behind the counter deciding whether to serve you.",
        },
      ],
    },
    {
      id: "first-contract",
      title: "Read your first contract",
      cards: [
        {
          type: "concept",
          id: "the-deal",
          label: "CONCEPT",
          title: "The deal",
          body: "Here's what we're building: a **crowdfunding contract**. Contributors send ETH and the contract holds onto it, with the rules set up front. If the goal is reached, the creator gets the money. If it isn't, everyone can pull their refund. No company in the middle, no one to trust. The contract itself is an escrow agent and enforces the deal.",
        },
        {
          type: "code",
          id: "fund-excerpt",
          label: "CODE",
          title: "Read it: it's most of a Kickstarter",
          file: "Crowdfund.sol",
          focus: ["fund"],
          reveal: true,
          note: "This is real **Solidity**, you don't need to read all of it yet. It's just a Kickstarter. The part in focus is `fund()`: it takes the ETH someone sends and records their share in the `contributions` ledger. Hover to see everything else.",
        },
        {
          type: "question",
          id: "where-does-the-eth-sit",
          label: "QUESTION",
          title: "Where does the ETH sit?",
          question: "After someone calls `fund()`, where does their ETH actually sit, and who can move it?",
          rubricConcepts: [
            "the ETH lives in the contract, not a wallet or a company server",
            "no person or company is in charge of it",
            "it only moves when the contract's code says so",
          ],
          hints: ["It's not in the creator's wallet, and not on a company server."],
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
            "One click. Your contract, with your `GOAL` line in it, compiles to bytecode and ships to a fresh EVM right here in this browser tab. Watch the console: it's a real transaction, it costs gas, and the contract lands at an address you can see.",
          sharesWorld: true,
          console: "open",
        },
        {
          type: "experiment",
          id: "what-just-happened",
          label: "EXPERIMENT",
          title: "What just happened",
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
          body: "Money isn't an add-on in Ethereum. Contracts have **balances**, just like accounts do. Inside a function, `msg.sender` is whoever called it and `msg.value` is how much ETH they sent along. A function only accepts ETH if it's marked `payable`. `fund()` is built from exactly those three.",
        },
        {
          type: "code-exercise",
          id: "declare-contributions",
          label: "CODE EXERCISE",
          title: "The ledger",
          region: "contributions",
          prompt:
            "The contract needs to remember who sent what, so we want a **ledger**: one row per contributor, an address on the left and the amount they sent on the right. That's exactly what a `mapping(address => uint256)` is. Declare one named `contributions`, marked `public`. Any address that hasn't contributed just reads zero.",
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
            "This is what your contract looks like from the outside: an app. Fund it from three browser accounts and watch the goal bar and the public ledger move. Every click signs a real transaction into the `fund()` you wrote, and the console logs each one.",
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
