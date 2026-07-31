import { TransactionJourney } from "./assets/TransactionJourney";
import { VendingMachine } from "./assets/VendingMachine";
import { WalletSafety } from "./assets/WalletSafety";
import { WorldComputer } from "./assets/WorldComputer";
import { StateNetwork, TransactionLifecycle } from "./assets/illustrations";
import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V2 — the skeleton for the restructure agreed in PR #63.
//
// ⚠️ BEHIND THE OUTLINE: OUTLINE.md next to this file is the source of truth
// and has since moved to 6 sections / 18 cards — the banking contrast now
// lives in its own section 3 (Why not just use a bank?) between More than
// money and Your money, your keys, with a custody bridge card. This file
// still implements the earlier 5-section pass and needs a rebuild to match.
//
// Card bodies are info-level drafts — every point the final copy must land,
// in order, in plain sentences — not polished prose. Bracketed notes mark
// placeholders. Ground rules from the outline: one home per concept; later
// mentions are one-line callbacks.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v2",
  title: "Ethereum 101 V2",
  overview:
    "Skeleton of the restructured Ethereum 101: what Ethereum is, what it can do, how you hold it, and how you use it. Bodies are info-level drafts, not final copy — see OUTLINE.md.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "what-is-ethereum",
      title: "What is Ethereum?",
      cards: [
        {
          type: "concept",
          id: "the-world-computer",
          label: "CONCEPT",
          title: "The world computer",
          illustrations: [StateNetwork],
          interactive: WorldComputer,
          body: "Most apps you use run on servers owned by one company. **Ethereum** runs on thousands of independent computers around the world, called **nodes**.\n\nTogether those nodes act as one shared computer. Each keeps its own copy of the same record: who owns what, and what programs are running.\n\nWhen something changes, every node checks it independently, and they all land on the same shared history. The duplicated effort is the point: everyone verifying means no one has to be trusted.\n\nNo company owns it. What that buys you is the next card.",
        },
        {
          type: "concept",
          id: "why-no-one-in-charge-matters",
          label: "CONCEPT",
          title: 'Why "no one in charge" matters',
          body: "Because no single group runs Ethereum:\n\n- The rules of the system are public — anyone can read them.\n- They apply to everyone equally, and changes can only happen in the open.\n- No administrator can freeze your account, block a valid action, or rewrite history.\n\nCompare that to the system we all grew up with: at a bank, a small group writes rules you can't realistically read, can change them, and decides what you're allowed to do. You use it on faith. [optional: one neutral clause referencing 2008 — or drop it]",
        },
      ],
    },
    {
      id: "more-than-money",
      title: "More than money",
      cards: [
        {
          type: "concept",
          id: "not-just-a-better-bitcoin",
          label: "CONCEPT",
          title: "Not just a better Bitcoin",
          body: "By now nearly everyone has heard of **Bitcoin** — it proved money can move without a bank.\n\nEthereum does that too. The difference: Ethereum can also run **programs**. That one difference is where everything else in this lab comes from.\n\nThose programs have a name, and a surprisingly good mental model.",
        },
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts",
          illustrations: [VendingMachine],
          body: 'A **smart contract** is a program stored on Ethereum, with its own address.\n\nThe mental model is a vending machine: right coin in, button pressed, item out — nobody behind the counter deciding whether to serve you.\n\nOnce deployed, the code is public and runs the same way every time, for everyone. This is what "rules written in code" looks like in practice.',
        },
        {
          type: "concept",
          id: "what-people-build",
          label: "CONCEPT",
          title: "What people build — and the buzzwords",
          body: "Because Ethereum runs programs, money is only the start. The categories — and the buzzwords you'll hear for them:\n\n- **DeFi** — borrowing, lending, and trading without a bank in the middle.\n- **Stablecoins** — tokens that hold steady against the dollar.\n- **NFTs** — digital objects you truly own, from art to game items to tickets.\n- **DAOs** — internet-native co-ops with shared treasuries and votes.\n- Plus identity, memberships, and games.\n\nNot every app needs Ethereum. It shines when strangers need shared rules and records without handing one company control.\n\n[interactive placeholder: tap-through app gallery or mini-quiz]",
        },
      ],
    },
    {
      id: "your-money-your-keys",
      title: "Your money, your keys",
      cards: [
        {
          type: "concept",
          id: "ether",
          label: "CONCEPT",
          title: "Ether",
          body: '**Ether (ETH)** is the currency built into Ethereum. You can hold it, and send it to anyone, anywhere, at any hour.\n\nIt trades against dollars and euros on exchanges. [one line only — "getting ETH" belongs to a later lab]\n\nOne thing to file away for later: ETH is also what pays the network for its work. More on that when we get to gas.',
        },
        {
          type: "concept",
          id: "accounts-and-addresses",
          label: "CONCEPT",
          title: "Accounts and addresses",
          body: "An **account** holds your ETH and lets you act on the network. It lives on the network itself — not on your phone or laptop.\n\nIts **address** is its public name, like an account number: it's what people use to send you ETH, and it's safe to share.\n\nAnyone can create an account in seconds. No paperwork, no ID, no permission.\n\nWhich raises a question: with no sign-up authority, how do you prove an account is yours?",
        },
        {
          type: "concept",
          id: "the-private-key",
          label: "CONCEPT",
          title: "The private key",
          body: "Every account comes with a **private key**: a secret value created along with it.\n\nKnowing that secret is the only thing that proves control. There's no manager behind it, no password reset, no ID check.\n\nAnyone who learns your private key controls the account and can take everything in it. **Never share it.**\n\n[interactive placeholder: private-key brute-force game — pick a digit count, crack short keys live, watch full-length keys become untouchable]",
        },
        {
          type: "concept",
          id: "wallets",
          label: "CONCEPT",
          title: "Wallets",
          body: "A **wallet** is an app on your device with two jobs: keep your private key secret, and let you use the network safely — send ETH, approve actions.\n\nDespite the name, it holds your key, not your ETH. Your ETH stays on the network.\n\nLose the key (and its backup, the **recovery phrase**) and there's no support desk to call. Which is why the next skill is knowing exactly what's safe to reveal.\n\n[teaser: the next lab is entirely about wallets]",
        },
        {
          type: "concept",
          id: "what-is-safe-to-share",
          label: "CONCEPT",
          title: "What is safe to share?",
          interactive: WalletSafety,
          body: "The rule: your **address** is public by design. Your **private key** and **recovery phrase** are never shared — no real app, support agent, or moderator needs them.\n\nOne more edge: a wallet signature can authorize an action without revealing your key. So read what you're approving — and if it's unclear, reject it.\n\nTry the interactive: which of the three is safe to share?",
        },
      ],
    },
    {
      id: "making-things-happen",
      title: "Making things happen",
      cards: [
        {
          type: "concept",
          id: "transactions",
          label: "CONCEPT",
          title: "Transactions",
          illustrations: [TransactionLifecycle],
          interactive: TransactionJourney,
          body: "A **transaction** is how you ask the network to do something. The simplest: send ETH to an address — a bank transfer, minus the bank.\n\nThe same mechanism operates smart contracts: vote on a proposal, buy an item in a game, join a fundraiser.\n\nThe flow is always the same: your wallet signs the instruction with your private key, broadcasts it, and the nodes check it against the rules. If it passes, it takes effect.\n\nMaking the network work for you has a price — that's next.",
        },
        {
          type: "concept",
          id: "gas",
          label: "CONCEPT",
          title: "Gas",
          body: "That price is called **gas** — a small fee paid in ETH. This is ETH's second job from earlier: paying the network for its work.\n\nWhy it exists: thousands of real machines spend hardware, electricity, and bandwidth on every action, and the fee pays for that effort.\n\nIt has a second purpose: because every action costs something, nobody can flood the network with junk for free.\n\nBigger actions cost more, and you pay even if your action fails — one more reason to read before you sign.\n\n[one-sentence aside: energy use fell ~99% with the 2022 switch to proof of stake; staking itself is a later lab]",
        },
        {
          type: "concept",
          id: "written-in-stone",
          label: "CONCEPT",
          title: "Written in stone",
          body: "Confirmed transactions are bundled into **blocks**, added one after another into a single chain: the **blockchain**. It's the shared history every node keeps.\n\nTwo consequences worth internalizing:\n\n- Activity is **public** by default — anyone can look.\n- Confirmed actions are effectively **irreversible** — there's no chargeback line.\n\nThe same permanence that stops history from being rewritten also means your mistakes stick. Powerful, with sharp edges.",
        },
      ],
    },
    {
      id: "putting-it-together",
      title: "Putting it together",
      cards: [
        {
          type: "question",
          id: "explain-it-to-a-friend",
          label: "QUESTION",
          title: "Explain it to a friend",
          question:
            'A friend says, "Ethereum is basically an online bank for crypto." Using what you\'ve learned, fix that picture: what is Ethereum actually, what can it do beyond payments, and what happens between clicking Confirm in a wallet and the action becoming permanent?',
          rubricConcepts: [
            "Ethereum is a shared computer run by thousands of independent nodes, not a company or a bank",
            "it runs programs (smart contracts), so apps beyond payments live on it",
            "an action is a transaction: the wallet signs with the private key, nodes check it, and it lands in a block permanently",
            "every action pays a small gas fee that compensates the machines doing the work and keeps spam out",
          ],
          hints: [
            "Start with who runs it — how many machines, owned by whom?",
            "What did the vending machine stand for?",
            "Trace one action end to end: sign, broadcast, check, block.",
          ],
        },
        {
          type: "summary",
          id: "the-big-picture",
          label: "SUMMARY",
          title: "The big picture, and what's next",
          body: "The arc you just walked: a shared computer no one owns → programs with rules baked in → your money and the key that controls it → transactions, their cost, and the permanent record.\n\nThe terms you now own:\n\n- **Node** — one of the computers running Ethereum.\n- **Smart contract** — a program on Ethereum; public code, runs the same for everyone.\n- **ETH** — the network's money, and what pays for every action.\n- **Address** — your account's public name.\n- **Private key** — the secret that is control. Never shared.\n- **Wallet** — the app that guards the key and signs for you.\n- **Transaction** — a signed instruction to the network.\n- **Gas** — the small fee every action pays.\n- **Blockchain** — the permanent, public record of everything confirmed.\n\nThe safety refrain, one last time: public by default, hard to reverse, your key is yours alone.\n\nNext up: a whole lab on wallets. Later: transactions in depth, staking, and building your own contracts.",
        },
      ],
    },
  ],
});
