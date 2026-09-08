import { DeadlineWindows, PublicLedger, Reentrancy } from "../ethereum-101/assets/illustrations";
import { BreakIt } from "./BreakIt";
import { DeployerAccount } from "./DeployerAccount";
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
  title: "Crowdfunding Contract",
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
          title: "You've seen a smart contract work",
          body: "In Ethereum 101 you met smart contracts from the outside. A vending machine took the right coin, refused the wrong one, and vended a snack accordingly.\n\nThose rules were a program, written in a language called **Solidity**, and somebody had to write it. This time you will write the code. You'll build a real crowdfunding app, one step at a time, all within the browser.\n\nYour code compiles and deploys to a small Ethereum-like machine living in this browser tab, so there's no wallet to set up and nothing leaves your machine, but the contract and the transactions are real.",
        },
        {
          type: "concept",
          id: "contracts-are-just-code",
          label: "CONCEPT",
          title: "Contracts are just code",
          body: "Let's dive into some real Solidity code. You can read this line by line, from top to bottom.  Each line is a rule or action the contract can run.\n\nA contract has two kinds of parts. **State** is the data it remembers between transactions. **Functions** are the actions that the contract can run.\n\nHere is a complete contract that keeps a separate count for every address:\n\n```solidity\ncontract Counter {\n  mapping(address => uint256) public count;\n\n  function increment() public {\n    count[msg.sender] += 1;\n  }\n}\n```\n\n`count` is the state. It lives on the chain and survives between transactions. `increment()` is a function anyone can call, and `msg.sender` is the address that sent the transaction. Next, let's take a closer look at the function.",
        },
        {
          type: "question",
          id: "read-the-counter",
          label: "QUESTION",
          title: "Read the counter",
          question:
            "In the `Counter` contract, calling `increment()` runs a single line:\n\n```solidity\ncount[msg.sender] += 1;\n```\n\n`msg.sender` is the address that called the function. So what do you think this line does?",
          rubricConcepts: ["it increments the count for the calling address (`msg.sender`) by 1"],
          hints: [
            "`msg.sender` is the caller’s address, so `count[msg.sender]` is their counter. What does `+= 1` do?",
            "Different callers have a different `msg.sender`, so whose count goes up when you call `increment()`?",
          ],
        },
        {
          type: "concept",
          id: "what-were-building",
          label: "CONCEPT",
          title: "What we're building",
          body: "Now that you cunderstand a little Solidity code, let's get started on a simple **crowdfunding contract**. It holds ETH and has three rules.\n\n- Contributors can send ETH into the contract.\n- If the campaign reaches its goal, the creator can claim the ETH.\n- If it falls short, contributors can take their money back.\n\nHere's the skeleton we'll start from. The gaps are the pieces you'll fill in over the next few cards, one at a time.\n\n```solidity\ncontract Crowdfund {\n  // GOAL: the funding target (you'll set this)\n  // contributions: a ledger of who sent what (you'll add this)\n\n  function fund() public payable {\n    // record the contribution (you'll write this)\n  }\n\n  function refund() public {\n    // pay contributors back if the goal isn't met (you'll write this)\n  }\n\n  function claim() public {\n    // pay the creator once the goal is reached\n  }\n}\n```\n\nLet's start writing the code!",
        },
      ],
    },
    {
      id: "set-and-deploy",
      title: "Set it, deploy it",
      cards: [
        {
          type: "code-exercise",
          id: "set-goal",
          label: "CODE EXERCISE",
          title: "Set the funding goal",
          region: "goal",
          prompt:
            "> Click `</> code` in the top right corner or press `c` any time to see the whole file. Any code you have added will be there, the rest still unfinished.\n\nEvery campaign needs a target. Set a constant named `GOAL` to `10 ether`. The shape is `type visibility constant NAME = value;`: use `uint256` as the type, make the visibility `public`, and use `constant` because the goal never changes after deployment. Solidity understands `ether` as a unit, so `10 ether` means exactly what it says.",
          placeholder: "uint256 public constant FEE = 2 ether;",
          placeholderTip: true,
          hints: [
            "Follow the placeholder's shape; only the name and value change.",
            "`public` lets anyone read it; `constant` bakes in the value in at deploy time.",
            "Write `uint256 public constant GOAL = 10 ether;`. `ether` is a built-in unit, no math needed.",
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
        {
          type: "concept",
          id: "who-signed-this",
          label: "CONCEPT",
          title: "Who signed this?",
          illustrations: [DeployerAccount],
          body: "Every deployment comes from an account. In this lab, that account is a disposable browser account: pre-funded inside the sandbox and used only for this in-browser chain. Developers often call that kind of throwaway funded account a **burner wallet**.\n\nOn a real testnet or mainnet, the shape is the same but the setup is not hidden. A deployer account needs ETH for gas, signs the deploy transaction, and sends it to the network. \n\nSo this page is skipping the external wallet step, but everything happens in the same way.",
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
            "A mapping takes arguments of key => value: the `address` is who contributed, the `uint256` is how much they sent.",
            "Mark it `public` the same way you did with `GOAL`. The placeholder shows the exact shape, just rename it.",
            "Write `mapping(address => uint256) public contributions;`.",
          ],
        },
        {
          type: "concept",
          id: "the-ledger-is-public",
          label: "CONCEPT",
          title: "The ledger is public",
          illustrations: [PublicLedger],
          body: "Anyone can read every row of that mapping: every contribution, every address. Addresses are **pseudonymous**, not private. Nobody knows it's you behind 0xab12…, but everything that address does is in the open.\n\n> Privacy on Ethereum is possible, but it takes extra work and isn't widely used yet, far from the default.",
        },
        {
          type: "code-exercise",
          id: "record-the-funding",
          label: "CODE EXERCISE",
          title: "Record the funding",
          region: "fund-body",
          prompt:
            "> You're only writing the body. Click `</> code` in the top right or press `c` any time to see the current state of the contract, with your work in it.\n\nA contribution has just arrived in the `fund()` function and passed the `require` checks. Two things still need to happen:\n\n1. The ledger has to remember this contributor's new total\n2. The contract should announce that a contribution landed, using the `Funded` event it already declares",
          placeholder: "balances[msg.sender] += msg.value;\nemit Deposited(msg.sender, msg.value);",
          preSubmitChecks: [
            {
              matchesAny: [
                String.raw`\bcontributions\s*\[\s*msg\.sender\s*\]`,
                String.raw`\bbalances\s*\[\s*msg\.sender\s*\]`,
                String.raw`\b[a-zA-Z_]\w*\s*\[\s*msg\.sender\s*\]\s*(?:\+=|=)`,
              ],
              message: "You still need the ledger line that adds this payment to the contributor's total.",
            },
            {
              forbids: String.raw`\bemit\s+Deposited\s*\(`,
              message: "This contract's event is named `Funded`, not `Deposited`. Use `emit Funded(...)` here.",
            },
            {
              matches: String.raw`\bemit\s+Funded\s*\(`,
              message: "You updated the ledger. Now emit `Funded(...)` so the contract announces the contribution.",
            },
            {
              forbids: String.raw`\bemit\s+Funded\s*\(\s*msg\.sender\s*\)`,
              message: "`Funded(...)` needs a second value after `msg.sender`: use `msg.value`.",
            },
            {
              forbids: String.raw`\bemit\s+Funded\s*\((?!\s*msg\.sender\s*,)`,
              message: "The first value in `Funded(...)` should be `msg.sender`, the contributor's address.",
            },
            {
              forbids: String.raw`\bemit\s+Funded\s*\(\s*msg\.sender\s*,(?!\s*msg\.value\s*\))`,
              message: "The second value in `Funded(...)` should be `msg.value`, the ETH they sent.",
            },
            {
              matches: String.raw`\bemit\s+Funded\s*\(\s*msg\.sender\s*,\s*msg\.value\s*\)`,
              message: "`Funded` needs both `msg.sender` and `msg.value`: who contributed and how much they sent.",
            },
            {
              matches: String.raw`\bcontributions\s*\[\s*msg\.sender\s*\]`,
              message: "Use `contributions`, not `balances`. `balances` was only the example name.",
            },
            {
              matches: String.raw`\bcontributions\s*\[\s*msg\.sender\s*\]\s*\+=`,
              message: "Use `+=` so a second contribution adds to the contributor's existing total.",
            },
            {
              matches: String.raw`\bcontributions\s*\[\s*msg\.sender\s*\]\s*\+=\s*msg\.value\b`,
              message: "Add `msg.value`; that is the ETH this contributor sent into `fund()`.",
            },
          ],
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
          title: "The code is the referee",
          illustrations: [DeadlineWindows],
          body: "Every deal needs someone to enforce it, and the contract handles that itself. Part of that is being able to say no. When a condition isn't met, it **reverts** the transaction, rolling everything back as if it never happened. The tool for that is `require(condition, \"reason\")`.\n\nIn Ethereum 101 you watched a transaction get carried out, fail, and still pay gas. Now you're on the other side of that story: you're the one writing the rule that makes it happen.\n\nTime is a rule too. The contract reads the time from `block.timestamp` and enforces a **deadline** fixed at deployment. Escrow agent and referee in one.",
        },
        {
          type: "code-exercise",
          id: "write-refund",
          label: "CODE EXERCISE",
          title: "Write refund()",
          region: "refund",
          prompt:
            "`refund()` is the deal's other half: if the campaign fell short, each contributor can take their money back. The order of these steps matters, and a later card is about why. Write the body in order:\n\n1. Require the deadline has passed, use error message 'funding still open' if not\n2. Require that the contract's ETH balance is below the `GOAL` (goal was reached)\n3. Require the caller's contribution is more than zero (nothing to refund)\n4. Save the caller's own contribution\n5. Zero their `contributions`, before any ETH moves\n6. Send them their amount, and require the transfer succeeded\n7. Emit `Refunded`",
          placeholder:
            'require(block.timestamp >= deadline, "too early");\nrequire(address(this).balance < TARGET, "target met");\nrequire(balances[msg.sender] != 0, "nothing saved");\nuint256 amount = balances[msg.sender];\nbalances[msg.sender] = 0;\n(bool ok, ) = msg.sender.call{ value: amount }("");\nrequire(ok, "send failed");\nemit Withdrawn(msg.sender, amount);',
          hints: [
            "Use `block.timestamp >= deadline` for the deadline check and `address(this).balance < GOAL` for the goal check.",
            "The caller's contribution is stored in `contributions[msg.sender]`. Save it with `uint256 amount = contributions[msg.sender];`.",
            "Set `contributions[msg.sender] = 0;` before sending ETH. The saved `amount` tells you how much to send.",
            'Send `amount` of ETH to `msg.sender` using `(bool ok, ) = msg.sender.call{ value: amount }("");`, then check success with `require(ok, "refund failed");`.',
            "Record the successful refund with `emit Refunded(msg.sender, amount);`. The event logs who received the refund and how much they received. This will be the last line of the function.",
          ],
        },
        {
          type: "experiment",
          id: "try-to-break-it",
          label: "EXPERIMENT",
          title: "Try to break it",
          scenario:
            "Deploy your crowdfunding contract and try to break the rules! Contribute, attempt to withdraw your contribution while the window is still open, then fast-forward the chain past the deadline and watch the very same request go through. Watch the console output to see it all happen. \n\nEvery refusal you see is a require you wrote, and every attempt paid gas. The network ran your rules either way.",
          component: BreakIt,
          console: "open",
          showDeploymentTip: false,
        },
        {
          type: "concept",
          id: "reentrancy",
          label: "CONCEPT",
          title: "Reentrancy, and why code is forever",
          illustrations: [Reentrancy],
          body: "A contract can receive ETH and automatically run code in response. An attacker can use that code to call `refund()` again while the first refund is still running.\n\nIf you send ETH **before clearing their contribution**, that second call still sees money owed and sends another refund. The attacker can repeat this to drain the pool. This is called **reentrancy**.\n\nYour code prevents it by setting the contribution to zero **before sending ETH**, so another call finds nothing left to refund.\n\nThat exact bug was behind TheDAO hack in 2016. Deployed code can't be patched, so the habit of updating state before external calls, and of auditing code before it ships, is non-negotiable in Ethereum.",
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
          note: "Here’s your complete crowdfunding contract, including `claim()`, which pays the creator when the goal is reached. Your code tracks contributions, enforces the deadline, and lets contributors get their money back if the campaign falls short.",
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
          showDeploymentTip: false,
          showDeploymentStatus: true,
        },
        {
          type: "experiment",
          id: "use-it-like-an-app",
          label: "EXPERIMENT",
          title: "Use it like an app",
          scenario:
            "This is your contract from the outside: an app. Pay into the pool from three browser accounts, then fast-forward the chain past the deadline and watch the deal settle itself. If the campaign fell short, every contributor can withdraw their own ETH; if the goal was hit, the creator claims the lot. Nobody signs off on any of it, only the code.",
          component: UseIt,
          reusesWorld: "ship-final",
          console: "open",
        },
        {
          type: "summary",
          id: "what-you-did",
          label: "SUMMARY",
          title: "You shipped a real contract",
          body: "You read, wrote, and deployed a real smart contract. Along the way, you learned about state and mappings, `payable` functions, `require` and deadlines, events, and protecting refunds from reentrancy. The crowdfunding contract you built tracks contributions and enforces its own rules, no referee needed.\n\nThat's Ethereum.\n\n[TODO: Add next labs info]",
        },
      ],
    },
  ],
});
