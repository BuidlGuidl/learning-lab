import { BreakIt } from "./BreakIt";
import { ReadTheMachine } from "./ReadTheMachine";
import { RunTheMachine } from "./RunTheMachine";
import { TheTill } from "./TheTill";
import { contracts } from "./contracts.gen";
import { deploy } from "./deploy";
import { tests } from "./tests";
import { defineLab } from "~~/lib/lab/define";

// The build-it follow-up to Ethereum 101 v2: the vending machine the learner
// used as a metaphor there becomes a contract they write, deploy, and run
// themselves, entirely in the browser.
export const lab = defineLab({
  id: "deploy-vending",
  title: "Build the Vending Machine",
  overview:
    "Takes a learner who finished Ethereum 101 from using the vending machine metaphor to building the real thing: writing, deploying, and running their own vending machine contract in the browser.",
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
          id: "you-have-used-one",
          label: "CONCEPT",
          title: "You've used one of these",
          body: "In Ethereum 101 you met the vending machine: put in the right coin, press the button, and it follows its rules with nobody behind the counter.\n\nHere's the part we skipped: those rules are a program, a **smart contract**, and somebody had to write it. This time it's you. You'll write the machine's rules in Solidity, deploy them, and sell snacks to real accounts.\n\nEverything happens inside this page. Your code compiles and runs on a small Ethereum-like computer living in this browser tab, so there's no wallet to set up and nothing leaves your machine, but the contract and the transactions are real.",
        },
        {
          type: "concept",
          id: "contracts-are-just-code",
          label: "CONCEPT",
          title: "Contracts are just code",
          body: "Smart contracts are written in a language called **Solidity**. If you've never written code, read it like a machine's rulebook: each line is one instruction, followed top to bottom.\n\nA contract has two kinds of parts. **State** is the data it remembers between transactions. **Functions** are the actions anyone can ask it to run.\n\nHere is a complete contract that keeps a separate count for every address:\n\n```solidity\ncontract Counter {\n  mapping(address => uint256) public count;\n\n  function increment() public {\n    count[msg.sender] += 1;\n  }\n}\n```\n\n`count` is the state. It lives on the chain and survives between transactions. `increment()` is a function anyone can call, and `msg.sender` is the address that sent the transaction. These few pieces are most of what you need to read a real contract.",
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
          id: "the-machines-skeleton",
          label: "CONCEPT",
          title: "The machine's skeleton",
          body: "Here's the machine we're building, with gaps where your lines will go. Over the next chapters you'll fill in five pieces: the price, the stock, the two rules that guard a sale, the sale itself, and the way the owner collects the money.\n\n```solidity\ncontract VendingMachine {\n  address public immutable owner;  // set once, at deploy\n\n  // PRICE: what a snack costs (you'll set this)\n  // stock: how many snacks are loaded (you'll set this)\n\n  mapping(address => uint256) public purchases;\n\n  function buy() public payable {\n    // the two rules (you'll write these)\n    // the sale itself (you'll write this)\n  }\n\n  function withdraw() public {\n    // pay the owner the takings (you'll write this)\n  }\n}\n```\n\nOnce this is deployed, nobody stands behind the counter. The code you're about to write is the whole shopkeeper.",
        },
      ],
    },
    {
      id: "machine-memory",
      title: "What the machine remembers",
      cards: [
        {
          type: "concept",
          id: "state-lives-on-chain",
          label: "CONCEPT",
          title: "State lives on the chain",
          body: "A contract's **state variables** are its memory. They don't live on your laptop; they live on the network itself, where every node keeps a copy, and they survive between transactions. Marking one `public` means anyone can read it, for free, without sending a transaction.\n\nSolidity also lets you say how permanent a value is. A **constant** is baked in when the contract deploys and can never change. Ordinary state can be updated by the contract's own functions.\n\nThe machine needs one of each: a price that's fixed for good, and a stock count that drops with every sale.",
        },
        {
          type: "code-exercise",
          id: "set-the-price",
          label: "CODE EXERCISE",
          title: "Set the price",
          region: "price",
          prompt:
            "> Hit the `</> code` button or press `c` any time to see the whole file, your lines filled in and the faded gaps still to come.\n\nEvery machine shows its price. Declare a constant named `PRICE` set to `1 ether`. The shape is `type visibility constant NAME = value;`: use `uint256`, mark it `public`, and `constant` because the price is baked into the machine for good. Solidity understands `ether` as a unit, so `1 ether` means exactly what it says.",
          placeholder: "uint256 public constant FEE = 2 ether;",
          hints: [
            "Follow the placeholder's shape; only the name and the value change.",
            "`public` lets anyone read it; `constant` bakes the value in at deploy time.",
            "Write `uint256 public constant PRICE = 1 ether;`. `ether` is a built-in unit, no maths needed.",
          ],
        },
        {
          type: "code-exercise",
          id: "stock-the-machine",
          label: "CODE EXERCISE",
          title: "Stock the machine",
          region: "stock",
          prompt:
            "The machine ships loaded with 5 snacks. Declare a state variable named `stock`: a `uint256`, marked `public`, starting at `5`.\n\nNo `constant` this time. Stock has to go down every time a snack sells, so this one is memory the machine can change.",
          placeholder: "uint256 public seats = 12;",
          hints: [
            "Same shape as `PRICE`, minus the `constant`, with a plain number instead of an ether amount.",
            "If you mark it `constant`, the sale you write later can't lower it and the contract won't compile.",
            "Write `uint256 public stock = 5;`.",
          ],
        },
        {
          type: "experiment",
          id: "deploy-it",
          label: "EXPERIMENT",
          title: "Deploy it",
          scenario:
            "Now make it real. When you press Deploy, your Solidity is compiled and sent to a fresh Ethereum-like machine running inside this browser tab. That machine is called an **Ethereum Virtual Machine**, or **EVM**.\n\nDeployment is a real transaction. It costs gas, it creates an address for your machine, and from that moment the price and stock you declared are live state on a chain.",
          sharesWorld: true,
          console: "open",
        },
        {
          type: "experiment",
          id: "what-just-happened",
          label: "EXPERIMENT",
          title: "What just happened",
          scenario:
            "Your Solidity was compiled to **bytecode**, and that bytecode now lives at your machine's address. On the real Ethereum network, the same bytes would be replicated across every full node on Earth, and anyone could read your machine's public state without asking permission.\n\nTry it. Ask the live contract for the price and the stock.",
          reusesWorld: "deploy-it",
          component: ReadTheMachine,
          console: "open",
        },
      ],
    },
    {
      id: "saying-no",
      title: "Saying no",
      cards: [
        {
          type: "concept",
          id: "the-contract-is-the-referee",
          label: "CONCEPT",
          title: "The contract is the referee",
          body: "A real vending machine doesn't argue with you. Feed it the wrong coin and it just refuses. Solidity's tool for refusing is:\n\n```solidity\nrequire(condition, \"reason\");\n```\n\nIf the condition is false, the transaction **reverts**: everything it did is rolled back as if it never ran, and the reason text travels back to whoever asked.\n\nIn Ethereum 101 you watched a transaction get carried out, fail, and still pay gas. Now you're on the other side of that story: you're the one writing the rule that makes it happen.\n\nThe machine has two rules guarding a sale: the coin must be exactly the price, and there must be a snack left to sell.",
        },
        {
          type: "code-exercise",
          id: "write-the-rules",
          label: "CODE EXERCISE",
          title: "Write the rules",
          region: "buy-guards",
          prompt:
            'A coin has just arrived in `buy()`. Before anything is handed out, the machine checks its two rules, in order:\n\n1. the payment must be exactly the price: `msg.value` (the ETH sent with the call) must equal `PRICE`. Refuse with the reason `"wrong coin"`.\n2. there must be a snack left: `stock` must be more than zero. Refuse with the reason `"sold out"`.\n\nOne `require(condition, "reason")` per rule, with those exact reason texts. These two lines are the machine\'s whole security system.',
          placeholder: 'require(msg.sender == judge, "not the judge");',
          hints: [
            "Each rule is one require line: the condition that must be true first, the refusal text second.",
            '"Exactly equal" is `==`, and "more than zero" is `> 0`. The values to compare are `msg.value`, `PRICE`, and `stock`.',
            'Write `require(msg.value == PRICE, "wrong coin");` then `require(stock > 0, "sold out");`.',
          ],
        },
        {
          type: "experiment",
          id: "try-to-break-it",
          label: "EXPERIMENT",
          title: "Try to break it",
          scenario:
            "Deploy the machine and attack your own rules. Pay too little, pay too much, and buy the machine empty.\n\nWatch the exact reasons you wrote come back at you, and notice that every refused attempt still cost the buyer gas. The network ran your rules, and running rules is work.",
          component: BreakIt,
          console: "open",
        },
      ],
    },
    {
      id: "making-the-sale",
      title: "Making the sale",
      cards: [
        {
          type: "concept",
          id: "money-in-receipt-out",
          label: "CONCEPT",
          title: "Money in, receipt out",
          body: "How does a contract take money at all? A function marked **payable** can receive ETH. The coin rides in on the transaction itself, `msg.value` says how much arrived, and the ETH lands in the contract's own balance. A contract has a balance just like your account does.\n\nThe skeleton gives the machine a receipt roll too: `purchases`, a **mapping** that pairs each buyer's address with how many snacks they've bought. It's the same shape as the `Counter`'s ledger from chapter one.\n\nOne more piece: contracts can make announcements. An **event** is a note the contract publishes when something happens, so apps watching the chain can react. The machine declares one at the top:\n\n```solidity\nevent Sold(address indexed buyer, uint256 stockLeft);\n```\n\nWith those three pieces, you can write the sale itself.",
        },
        {
          type: "code-exercise",
          id: "record-the-sale",
          label: "CODE EXERCISE",
          title: "Record the sale",
          region: "buy-body",
          prompt:
            "> You're only writing the body. Hit the `</> code` button or press `c` to see the whole contract with your work in it.\n\nBoth rules passed: the coin is right and there's a snack to sell. Three things happen, in order:\n\n1. one snack leaves the shelf: take 1 off `stock`\n2. the receipt roll remembers this buyer: add 1 to their row in `purchases`\n3. the machine announces the sale: emit `Sold` with the buyer and the stock that's left\n\n`Sold` takes the buyer's address and the remaining stock, and you have both in scope: `msg.sender` and `stock`.",
          placeholder: "points -= 1;\nvisits[msg.sender] += 1;\nemit Checked(msg.sender, points);",
          hints: [
            "Taking one off is `-= 1`, and the buyer's own row is `purchases[msg.sender]`.",
            "Order matters for the announcement: take the snack off `stock` first, so the number you emit is the stock after this sale.",
            "Write `stock -= 1;` then `purchases[msg.sender] += 1;` then `emit Sold(msg.sender, stock);`.",
          ],
        },
        {
          type: "question",
          id: "why-keep-the-receipts",
          label: "QUESTION",
          title: "Why keep the receipts?",
          question:
            "The machine's balance already tells you how much ETH it has taken. So why keep `purchases`, the per-buyer receipt roll? What can it answer that the balance can't?",
          rubricConcepts: [
            "the balance is a single total: it can say how much came in, never who bought or how many times each",
            "`purchases` is a per-address record, readable by anyone, that ties buyers to what they bought",
            "per-person records are how contracts keep per-person promises: refunds, rewards, or limits per buyer all need one",
          ],
          hints: ["Imagine the machine gave every tenth snack free. What would it need to know about each buyer?"],
        },
      ],
    },
    {
      id: "money-comes-out",
      title: "The money comes out",
      cards: [
        {
          type: "concept",
          id: "who-owns-the-machine",
          label: "CONCEPT",
          title: "Who owns the machine?",
          body: "Every sale leaves ETH sitting inside the contract. Someone must be allowed to collect it, and only that someone.\n\nThe skeleton settled this in its first line: `address public immutable owner;`. The value is set in the **constructor**, a special function that runs exactly once, at the moment of deployment:\n\n```solidity\nconstructor() {\n  owner = msg.sender;\n}\n```\n\nAt deploy time, `msg.sender` is whoever sent the deploy transaction. That's you.\n\n**immutable** means written once, then read-only forever. So the machine's owner is decided the moment it's deployed, recorded on the chain in public, and can never be quietly changed.",
        },
        {
          type: "code-exercise",
          id: "write-withdraw",
          label: "CODE EXERCISE",
          title: "Write withdraw()",
          region: "withdraw",
          prompt:
            'Time to empty the till. Write the body of `withdraw()`, in order:\n\n1. only the owner may do this: require that `msg.sender` is `owner`, with the reason `"only the owner"`\n2. read the machine\'s whole balance into `uint256 amount` (a contract reads its own balance as `address(this).balance`), and require it\'s more than zero, with the reason `"nothing to withdraw"`\n3. send it to the owner, and require the send worked: sending raw ETH is `(bool ok, ) = owner.call{ value: amount }("");` followed by `require(ok, "withdraw failed");`\n\nThe call pattern in step 3 is the one new thing here. It\'s the standard way a contract pays someone.',
          placeholder:
            'require(msg.sender == judge, "not the judge");\nuint256 prize = address(this).balance;\nrequire(prize > 0, "no prize yet");\n(bool ok, ) = judge.call{ value: prize }("");\nrequire(ok, "send failed");',
          hints: [
            'The gate is `require(msg.sender == owner, "only the owner");`. The comparison is the same shape as the rules you wrote for buy().',
            'Then `uint256 amount = address(this).balance;` and `require(amount > 0, "nothing to withdraw");`.',
            'Finish with `(bool ok, ) = owner.call{ value: amount }("");` and `require(ok, "withdraw failed");`.',
          ],
        },
        {
          type: "concept",
          id: "code-is-forever",
          label: "CONCEPT",
          title: "Code is forever",
          body: "One habit to take from this chapter. When a contract sends ETH, the receiver can be a contract too, with code that runs the moment the money arrives. If your function sends before it has finished its own bookkeeping, that code can call straight back in and catch your contract mid-thought. That's a **reentrancy** attack. It drained TheDAO of millions in 2016, and it still bites new contracts today.\n\nThe defense is a rule of order: finish updating your own state before any ETH leaves.\n\nYour `withdraw()` is safe as written, because it sends the entire balance to one fixed owner. But the reason the habit is non-negotiable is the other thing you've learned about this network: deployed code can't be patched. The chain keeps running exactly what you shipped, mistakes included.",
        },
        {
          type: "experiment",
          id: "the-till",
          label: "EXPERIMENT",
          title: "The till",
          scenario:
            "Deploy the machine and put the ownership rule to work. Have a customer buy a snack so there's money in the till, let that same customer try to empty it, then empty it yourself.\n\nThe rejection the stranger gets is your first line doing its job.",
          component: TheTill,
          console: "closed",
        },
      ],
    },
    {
      id: "ship-it",
      title: "Ship it, run it",
      cards: [
        {
          type: "code",
          id: "the-finished-machine",
          label: "CODE",
          title: "The finished machine",
          file: "VendingMachine.sol",
          note: "The full reveal, every learner line in place, plus restock(amount): an owner-only top-up so the machine can live past its first five snacks. A fixed price, a public shelf, receipts for every buyer, and a till only the owner can empty. A snack shop that runs itself.",
        },
        {
          type: "experiment",
          id: "ship-final",
          label: "EXPERIMENT",
          title: "Ship it",
          scenario:
            "Deploy the finished machine, your lines and all. Every check you've earned in this lab runs against it on the way in.\n\nOn the real network, this exact deploy would put your vending machine at an address reachable by anyone on Earth, open for business the moment the block lands.",
          sharesWorld: true,
          console: "open",
        },
        {
          type: "experiment",
          id: "run-your-machine",
          label: "EXPERIMENT",
          title: "Run your machine",
          scenario:
            "This is your machine from the outside: an app. Sell snacks to three customers, watch the shelf and the till move with every coin, sell it empty, then collect the takings and restock as the owner.\n\nEvery button presses your code, and the only rules in play are the ones you wrote.",
          component: RunTheMachine,
          reusesWorld: "ship-final",
          console: "closed",
        },
        {
          type: "summary",
          id: "you-built-a-real-one",
          label: "SUMMARY",
          title: "You built a real machine",
          body: "The vending machine you met as a metaphor is now a program you wrote yourself. Along the way: state and constants, `payable` and `msg.value`, `require` and reverts, mappings, events, a constructor that fixes the owner for good, the call pattern contracts use to pay people, and the bookkeeping-before-money habit that keeps them safe.\n\nIt takes real money and enforces its own rules, with nobody watching over it. That's a smart contract.\n\nNext up: real networks and testnets, deploying with a wallet signature instead of a browser sandbox, and machines that sell more interesting things than snacks.",
        },
      ],
    },
  ],
});
