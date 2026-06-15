import { ShipIt } from "./ShipIt";
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
          body: "Ethereum is one computer run by thousands of independent machines around the world. Every node runs the same programs and agrees on the result, so there's no off switch, no admin, no one who can block a transaction, change the rules, or rewrite history. The network as a whole is the computer, and nobody owns it.",
        },
        {
          type: "concept",
          id: "accounts-transactions-gas",
          label: "CONCEPT",
          title: "Accounts, transactions, gas",
          body: "You act on Ethereum through an account. To change anything you sign a transaction, broadcast it, and a node includes it in a block — from then on it's permanent. Every change costs gas, a fee paid to the network for the computation it does on your behalf, which is what keeps a shared world computer from being spammed to death.",
        },
        {
          type: "question",
          id: "one-company-ethereum",
          label: "QUESTION",
          title: "What changes with one operator?",
          question: "If one company ran Ethereum, what could it do that the real network can't?",
          rubricConcepts: [
            "censor users or apps",
            "change the rules unilaterally",
            "single point of failure",
            "everyone is forced to trust the operator",
          ],
          hint: "Think about what your bank or a social platform can do to your account.",
        },
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts",
          body: "A smart contract is a program stored on chain. Its code is public by default, it runs exactly as written, and nobody can take it down. The classic mental model is a vending machine: coin in, rules applied, item out — no clerk in the middle deciding whether to serve you.",
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
          body: "Here's what we're building: a crowdfunding contract. Contributors send ETH, the contract holds it, and the rules are fixed up front — if the goal is reached the creator gets the money, if not, everyone can pull a refund. No company in the middle, no one to trust. The contract itself is the escrow agent.",
        },
        {
          type: "code",
          id: "fund-excerpt",
          label: "CODE",
          title: "Read it: it's most of a Kickstarter",
          file: "Crowdfund.sol",
          note: "This is real Solidity — the whole contract. Don't worry about reading all of it yet: focus on the state at the top and fund(), the function contributors call. You'll meet refund() and claim() later in the lab. The faded lines are gaps you'll fill in yourself.",
        },
        {
          type: "question",
          id: "where-does-the-eth-sit",
          label: "QUESTION",
          title: "Where does the ETH sit?",
          question: "After someone calls fund(), where does their ETH actually sit?",
          rubricConcepts: [
            "the contract itself holds the balance",
            "no person or company is custodian",
            "only the contract's code can move it",
          ],
          hint: "It's not in the creator's wallet, and not on a company server.",
        },
        {
          type: "code-exercise",
          id: "declare-goal",
          label: "CODE EXERCISE",
          title: "Declare the goal",
          region: "goal",
          prompt:
            "Every campaign needs a target. Declare a constant named `GOAL` set to `10 ether`. The shape is `type visibility constant NAME = value;` — use `uint256`, mark it `public`, and `constant` because the goal never changes after deployment. Solidity understands `ether` as a unit, so `10 ether` means exactly what it says. Press `c` anytime to see the whole file — the gaps are yours to fill.",
          placeholder: "uint256 public constant FEE = 2 ether;",
        },
        {
          type: "experiment",
          id: "deploy-goal",
          label: "EXPERIMENT",
          title: "Deploy it",
          scenario:
            "One click. Your contract — your GOAL line included — compiles to bytecode and ships to a fresh EVM right here in this browser tab. Watch the console: it's a real transaction, it costs gas, and the contract lands at an address you can see.",
        },
        {
          type: "concept",
          id: "what-just-happened",
          label: "CONCEPT",
          title: "What just happened",
          body: "Your Solidity source was compiled to bytecode, and that bytecode is now running on an EVM in this tab. On mainnet the exact same bytes would live on every node in the network, and anyone could read the contract's state and verify its source. Open source isn't a virtue bolted on afterwards here — it's the default condition of code on Ethereum.",
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
          title: "ETH is native",
          body: "Money isn't an add-on in Ethereum — contracts have balances, just like accounts do. Inside a function, `msg.sender` is whoever called it and `msg.value` is how much ETH they sent along. A function only accepts ETH if it's marked `payable`. Those three pieces are all fund() needs.",
        },
        {
          type: "code-exercise",
          id: "declare-contributions",
          label: "CODE EXERCISE",
          title: "The ledger",
          region: "contributions",
          prompt:
            "The contract needs to remember who sent what. Declare a `mapping(address => uint256)` named `contributions`, marked `public` — a ledger keyed by address. Every contributor gets a row; everyone else's row just reads zero.",
          placeholder: "mapping(address => uint256) public scores;",
        },
        {
          type: "concept",
          id: "the-ledger-is-public",
          label: "CONCEPT",
          title: "The ledger is public",
          body: "Anyone can read every row of that mapping — every contribution, every address. Addresses are pseudonymous, not private: nobody knows it's you behind 0xab12…, but everything that address does is in the open. Honest framing: privacy on Ethereum is an open frontier the ecosystem is actively building, not a solved problem.",
        },
        {
          type: "code-exercise",
          id: "record-the-funding",
          label: "CODE EXERCISE",
          title: "Record the funding",
          region: "fund-body",
          prompt:
            "The requires are already in place — funding is open and some ETH arrived. Your job is the two lines that matter: add `msg.value` to `msg.sender`'s row in `contributions`, then `emit Funded(msg.sender, msg.value);` so the outside world hears about it.",
          placeholder: "balances[msg.sender] += msg.value;\nemit Deposited(msg.sender, msg.value);",
        },
        {
          type: "question",
          id: "why-keep-the-mapping",
          label: "QUESTION",
          title: "Why keep the mapping?",
          question:
            "`address(this).balance` already tells the contract how much was raised in total. Why does it also keep `contributions`, a per-address record?",
          rubricConcepts: [
            "refunds require knowing who paid what",
            "the balance is only an aggregate",
            "the mapping is the ledger that makes refunds possible",
          ],
          hint: "Think back to the deal: what did we promise contributors if the goal isn't reached?",
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
          body: 'require(condition, "reason") is how a contract enforces its rules: if the condition fails, the whole transaction rolls back as if it never happened. And block.timestamp gives the contract a clock, so it can enforce a deadline without anyone checking a calendar. Escrow agent and referee, in one program.',
        },
        {
          type: "code-exercise",
          id: "write-refund",
          label: "CODE EXERCISE",
          title: "Write refund()",
          region: "refund",
          prompt:
            "The deal's other half: if the goal isn't reached, contributors get their money back. Write the body of refund(), in this order: require the deadline has passed (`block.timestamp >= deadline`), require the goal wasn't reached (`address(this).balance < GOAL`), read the caller's contribution into `uint256 amount` and require it's more than zero, set their row in `contributions` to zero, send with `(bool ok, ) = msg.sender.call{ value: amount }(\"\");` and require `ok`. Finish with `emit Refunded(msg.sender, amount);`. Zero first, then send — the next card is about why that order matters.",
          placeholder:
            'require(block.timestamp >= deadline, "too early");\nuint256 amount = balances[msg.sender];\nbalances[msg.sender] = 0;\n(bool ok, ) = msg.sender.call{ value: amount }("");\nrequire(ok, "send failed");',
        },
        {
          type: "concept",
          id: "reentrancy",
          label: "CONCEPT",
          title: "Reentrancy, and why code is forever",
          body: "The receiver of ETH can be a contract too, with code that runs the moment the ETH arrives — and that code can call refund() again, mid-flight. If refund() sent first and zeroed after, those nested calls would each pass the checks and drain everything. That exact bug was TheDAO hack in 2016. Deployed code can't be patched, so the discipline — update state before external calls — and the audit culture around it are sacred in Ethereum.",
        },
        {
          type: "question",
          id: "walk-the-attack",
          label: "QUESTION",
          title: "Walk through the attack",
          question:
            "A malicious contract calls refund(), and the moment the ETH arrives it calls refund() again. Walk through your code: why does the second call get nothing?",
          rubricConcepts: [
            "the contribution was zeroed before the send",
            "the second call fails the require or has zero to transfer",
            "state was updated before the external call",
          ],
          hint: "Follow your lines in order: what is contributions[attacker] by the time the second call runs?",
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
          note: "The full reveal — every learner line in place, plus claim(), the function that pays the creator when the goal is hit. A fixed goal, a public ledger, a deadline, refunds that can't be gamed. The whole deal, enforced by code.",
        },
        {
          type: "experiment",
          id: "ship-final",
          label: "EXPERIMENT",
          title: "Ship it",
          scenario:
            "Deploy the finished contract, your lines and all. Every check you've earned in this lab runs against it on the way in. On mainnet, this exact same deploy would put your crowdfund at an address reachable by anyone on Earth.",
          component: ShipIt,
        },
        {
          type: "experiment",
          id: "use-it-like-an-app",
          label: "EXPERIMENT",
          title: "Use it like an app",
          scenario:
            "This is what your contract looks like from the outside — an app. Fund it from three browser accounts and watch the goal bar and the public ledger move. Every click signs a real transaction into the fund() you wrote.",
          component: UseIt,
        },
        {
          type: "summary",
          id: "what-you-did",
          label: "SUMMARY",
          title: "You shipped a real contract",
          body: "You read, wrote, and deployed a real smart contract. Along the way: a network nobody owns, accounts and gas, state and mappings, payable functions, require and deadlines, events, and the reentrancy discipline that separates working Solidity from safe Solidity. The crowdfund you built holds real value and enforces its own rules — no referee needed. That's Ethereum.",
        },
      ],
    },
  ],
});
