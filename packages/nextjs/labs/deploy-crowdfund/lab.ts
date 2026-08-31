import { BreakIt } from "./BreakIt";
import { ReadGoal } from "./ReadGoal";
import { UseIt } from "./UseIt";
import { contracts } from "./contracts.gen";
import { deploy } from "./deploy";
import { tests } from "./tests";
import { defineLab } from "~~/lib/lab/define";

// The build-it follow-up to Ethereum 101 v2, on v1's proven crowdfund arc: the
// fundraiser the learner watched revert in the gas lab becomes a contract they
// write, deploy, and use themselves, entirely in the browser.
export const lab = defineLab({
  id: "deploy-crowdfund",
  title: "Build the Crowdfund",
  overview:
    "Takes a learner who finished Ethereum 101 from watching contracts enforce deals to building one: writing, deploying, and using their own crowdfunding contract in the browser.",
  contracts,
  deploy,
  tests,
  chapters: [
    {
      id: "using-to-building",
      title: "From using to building",
      cards: [
        {
          type: "concept",
          id: "you-watched-one-work",
          label: "CONCEPT",
          title: "You've watched one of these work",
          body: "In Ethereum 101 you met smart contracts from the outside. A vending machine took the right coin and refused the wrong one. And in the gas lab, a fundraiser filled up a moment before your contribution landed, so the contract undid it: money returned, rules upheld, gas paid.\n\nThose rules were a program, written in a language called **Solidity**, and programs are written by people. In this lab, that person is you. You'll build that kind of fundraiser yourself, rule by rule, and then use it like an app.\n\nEverything happens inside this page. Your code compiles and deploys to a small Ethereum-like machine living in this browser tab, so there's no wallet to set up and nothing leaves your machine. The code, the deployment, and the transactions are all real.",
        },
        {
          type: "concept",
          id: "contracts-are-just-code",
          label: "CONCEPT",
          title: "Contracts are just code",
          body: "Smart contracts are written in **Solidity**. If you've never written code, read it like a deal's rulebook: each line is one instruction, followed top to bottom.\n\nA contract has two kinds of parts. **State** is the data it remembers between transactions. **Functions** are the actions anyone can ask it to run.\n\nHere is a complete contract that keeps a separate count for every address:\n\n```solidity\ncontract Counter {\n  mapping(address => uint256) public count;\n\n  function increment() public {\n    count[msg.sender] += 1;\n  }\n}\n```\n\n`count` is the state. It lives on the chain and survives between transactions. `increment()` is a function anyone can call, and `msg.sender` is the address that sent the transaction. These few pieces are most of what you need to read a real contract.",
        },
        {
          type: "question",
          id: "read-the-counter",
          label: "QUESTION",
          title: "Read the counter",
          question:
            "In the `Counter` contract, calling `increment()` runs a single line:\n\n```solidity\ncount[msg.sender] += 1;\n```\n\n`msg.sender` is the address that called the function. So what does this line do?",
          rubricConcepts: ["it increments the count for the calling address (`msg.sender`) by 1"],
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
          body: "Now that you can read a little Solidity, here is what we are going to build with it: a simple **crowdfunding contract**. It holds ETH and has three rules.\n\n- Contributors can send ETH into the contract.\n- If the campaign reaches its goal, the creator can claim the ETH.\n- If it falls short, contributors can take their money back.\n\nHere's the skeleton we'll start from. The gaps are the pieces you'll fill in yourself over the next few cards, one at a time.\n\n```solidity\ncontract Crowdfund {\n  // GOAL: the funding target (you'll set this)\n  // contributions: a ledger of who sent what (you'll add this)\n\n  function fund() public payable {\n    // record the contribution (you'll write this)\n  }\n\n  function refund() public {\n    // pay contributors back if the goal isn't met (you'll write this)\n  }\n\n  function claim() public {\n    // pay the creator once the goal is reached\n  }\n}\n```\n\nThe interesting part is that no company is running this behind the scenes. The contract follows these rules on its own.",
        },
      ],
    },
    {
      id: "declare-and-deploy",
      title: "Declare it, deploy it",
      cards: [
        {
          type: "code-exercise",
          id: "declare-goal",
          label: "CODE EXERCISE",
          title: "Declare the goal",
          region: "goal",
          prompt:
            "> Hit the `</> code` button or press `c` any time to see the whole file, your lines filled in and the faded gaps still to come.\n\nEvery campaign needs a target. Declare a constant named `GOAL` set to `10 ether`. The shape is `type visibility constant NAME = value;`: use `uint256`, mark it `public`, and `constant` because the goal never changes after deployment. Solidity understands `ether` as a unit, so `10 ether` means exactly what it says.",
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
          scenario:
            "Your Solidity source was compiled to **bytecode**, and that bytecode is now running on an **EVM** in the browser. On a live network like Ethereum mainnet, the same bytes would be part of Ethereum's shared state and replicated across full nodes in the network. Anyone could read the contract's public state, inspect its bytecode, and, if the source code has been published, verify that the source compiles to the deployed bytecode.",
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
          body: "Just like your account, a contract has its own **balance**. ETH can go in and come back out.\n\nTo accept ETH, a function has to be marked `payable`, otherwise the call is rejected. Once it's in, `msg.value` tells you how much arrived, just like `msg.sender` tells you who sent it.\n\n```solidity\nfunction fund() public payable {\n  // msg.value = the ETH sent with this call\n}\n```\n\nNext, we'll give the contract a way to record every contribution.",
        },
        {
          type: "code-exercise",
          id: "declare-contributions",
          label: "CODE EXERCISE",
          title: "Declare the ledger",
          region: "contributions",
          prompt:
            "The contract needs to remember who sent what, so we'll keep a **ledger** that pairs each contributor's address with the amount they sent. It's the same `mapping(address => uint256)` shape as the `Counter`, except the number it stores is now an ETH amount instead of a call count.\n\nDeclare one named `contributions`, marked `public`. Any address that hasn't contributed just reads zero.",
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
          body: "Anyone can read every row of that mapping: every contribution, every address. Addresses are **pseudonymous**, not private. Nobody knows it's you behind 0xab12…, but everything that address does is in the open.\n\n> Privacy on Ethereum is possible, but it takes extra work and isn't widely used yet, far from the default.",
        },
        {
          type: "code-exercise",
          id: "record-the-funding",
          label: "CODE EXERCISE",
          title: "Record the funding",
          region: "fund-body",
          prompt:
            "> You're only writing the body. Hit the `</> code` button or press `c` any time to see the current state of the contract, with your work in it.\n\nA contribution has just arrived in the `fund()` function and passed the `require` checks. Two things still need to happen:\n\n1. the ledger has to remember this contributor's new total\n2. the contract should announce that a contribution landed, using the `Funded` event it already declares",
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
          title: "The contract is the referee",
          body: "Every deal needs someone to enforce it, and the contract handles that itself. Part of that is being able to say no. When a condition isn't met, it **reverts** the transaction, rolling everything back as if it never happened. The tool for that is `require(condition, \"reason\")`.\n\nIn Ethereum 101 you watched a transaction get carried out, fail, and still pay gas. Now you're on the other side of that story: you're the one writing the rule that makes it happen.\n\nTime is a rule too. The contract reads the time from `block.timestamp` and enforces a **deadline** fixed at deployment. Escrow agent and referee in one.",
        },
        {
          type: "code-exercise",
          id: "write-refund",
          label: "CODE EXERCISE",
          title: "Write refund()",
          region: "refund",
          prompt:
            "`refund()` is the deal's other half: if the campaign fell short, each contributor can take their money back. The order of these steps matters, and a later card is about why. Write the body in order:\n\n1. allow the refund only if the deadline has passed and the goal wasn't reached\n2. read the caller's own contribution, and require it's more than zero\n3. zero their row in `contributions`, before any ETH moves\n4. send them their amount, and require the transfer succeeded\n5. emit `Refunded`",
          placeholder:
            'require(block.timestamp >= deadline, "too early");\nuint256 amount = balances[msg.sender];\nbalances[msg.sender] = 0;\n(bool ok, ) = msg.sender.call{ value: amount }("");\nrequire(ok, "send failed");',
          hints: [
            "The two guards are `block.timestamp >= deadline` and `address(this).balance < GOAL`. Then `uint256 amount = contributions[msg.sender];` and require `amount > 0`.",
            'Sending raw ETH is `(bool ok, ) = msg.sender.call{ value: amount }("")` followed by `require(ok, "send failed")`. That pattern is the one new thing here, the rest you\'ve met.',
            "Order: set `contributions[msg.sender] = 0;` before the `call`, then `emit Refunded(msg.sender, amount);` last.",
          ],
        },
        {
          type: "experiment",
          id: "try-to-break-it",
          label: "EXPERIMENT",
          title: "Try to break it",
          scenario:
            "Deploy the campaign and try to bend your own rules. Contribute, demand your money back while the window is still open, then fast-forward the chain past the deadline and watch the very same request go through. Then try to refund twice.\n\nEvery refusal you see is a require you wrote, and every attempt paid gas. The network ran your rules either way.",
          component: BreakIt,
          console: "open",
        },
        {
          type: "concept",
          id: "reentrancy",
          label: "CONCEPT",
          title: "Reentrancy, and why code is forever",
          body: "The receiver of ETH can be a contract too, with code that runs the moment the ETH arrives, and that code can call `refund()` again before the first call finishes. That's a **reentrancy** attack. If `refund()` sent first and zeroed after, those nested calls would each pass the checks and drain everything.\n\nThat exact bug was behind TheDAO hack in 2016. Deployed code can't be patched, so the habit of updating state before external calls, and of auditing code before it ships, is non-negotiable in Ethereum.",
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
          hints: ["Follow your lines in order: what is `contributions[attacker]` by the time the second call runs?"],
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
          body: "The fundraiser you once watched from the outside is now a program you wrote yourself. Along the way: state and mappings, `payable` functions and `msg.value`, `require` and deadlines, events, the call pattern contracts use to pay people, and the reentrancy discipline that separates working Solidity from safe Solidity.\n\nThe crowdfund you built holds real value and enforces its own rules, no referee needed.\n\nFrom here the road leads outward: real networks and testnets, deploying with a wallet signature instead of a browser sandbox, and contracts that hold more than one campaign.",
        },
      ],
    },
  ],
});
