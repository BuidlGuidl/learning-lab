import { TransactionJourney } from "./assets/TransactionJourney";
import { VendingMachine } from "./assets/VendingMachine";
import { WalletSafety } from "./assets/WalletSafety";
import { WorldComputer } from "./assets/WorldComputer";
import { StateNetwork, TransactionLifecycle } from "./assets/illustrations";
import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V4 — a fresh, expansive rebuild for issue #59.
//
// Flow: open with the big-picture "what is Ethereum" (the world-computer card
// lifted from v1), pivot to WHY it exists (the problems with centralized
// banking, from v2), show how Ethereum answers each problem (v2), then widen
// out into the pieces a newcomer actually needs — programmability, Ether,
// accounts, wallets, transactions, and gas — before a recall question and a
// summary.
//
// Ordering follows the v3 curriculum's arc; the prose is drawn from v2's
// "centralization is bad / here's how Ethereum solves it" copy, with the
// world-computer opener and the transaction-lifecycle card adapted from the
// live ethereum-101 lab.
//
// No contract-writing exercise: this is the conceptual on-ramp. Later developer
// labs pick up Solidity, deployment, and security.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v4",
  title: "Ethereum 101 V4",
  overview:
    "A beginner's tour of Ethereum: what it is, the problems with the traditional system it was built to fix, and the core pieces — Ether, accounts, wallets, transactions, and gas — that you use to interact with it.",
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
          body: "Most apps you use run on servers owned by a single company.\n**Ethereum is different**, it runs on thousands of independent computers around the world, called **nodes**.\n\nTogether, those nodes act as one shared computer. Every node keeps its own copy of the same record: who owns what, and the **programs** running on the network, called **smart contracts**.\n\nWhen something changes, every node runs the same check on its own copy, and they all agree on a single shared history. The duplicated effort is the point: because everyone verifies the work independently, no one has to trust a central authority.\n\nNo company owns Ethereum, so there is no admin who can block a valid transaction, delete an app, or rewrite history.",
        },
        {
          type: "concept",
          id: "why-build-a-new-computer",
          label: "CONCEPT",
          title: "Why build a whole new computer?",
          body: "That's a lot of machinery: thousands of nodes, cryptographic keys, a fee on every action. It's fair to ask why anyone would build something so elaborate when we already have banks, apps, and payment systems that mostly work.\n\nThe answer is that \"mostly works\" hides some real problems, and almost all of them come from the same source: one group being in control.\n\nBefore we look closer at how Ethereum works, let's look at what it's actually trying to fix. We'll use the system we all know best, the traditional bank, as our example.",
        },
      ],
    },
    {
      id: "centralization-problems",
      title: "The trouble with the traditional system",
      cards: [
        {
          type: "concept",
          id: "the-status-quo",
          label: "CONCEPT",
          title: "The status quo",
          body: "We all have experience using the traditional centralized banking system. For the most part, it seems to work great. We can easily move our funds and receive loans to finance things that we couldn't otherwise afford.\n\nBut the centralized nature of the traditional system means that rule making and enforcement are handled by a small group. This regulatory and enforcement chokepoint creates several issues that we don't often think about. Let's look at three of them.",
        },
        {
          type: "concept",
          id: "rules-can-be-selfish",
          label: "CONCEPT",
          title: "Rules can be selfish",
          body: "The rules created by centralized regulators are advertised as being unbiased and fair for all users. But is that always the case?\n\nIt's easy to see how those making the rules might be tempted to stack them in their own favor, and that unfortunately has happened.\n\nOne of the most well known examples was the 2008 financial crisis and bank bailout. Banks made reckless bets that should have resulted in their bankruptcy, but selfish regulations gave them unfair help at the expense of the users. The banks kept going like nothing happened while ordinary people lost their homes and jobs.",
        },
        {
          type: "concept",
          id: "rules-are-complex-and-fluid",
          label: "CONCEPT",
          title: "Rules are complex, and they change",
          body: "The regulations running the traditional banking system are incredibly complex. Gaining the knowledge required to understand exactly what is going on takes years of specialized education.\n\nThe average user simply doesn't have the training or time to truly understand these rules, so we end up using the system on blind faith, trusting that everything is fine behind the scenes.\n\nTo make matters worse, those rules are constantly being tweaked and re-written. The rules you think you're playing by can change without you ever knowing anything is different. That's not a great way to maintain trust in a system that holds your money.",
        },
      ],
    },
    {
      id: "ethereum-solution",
      title: "How Ethereum fixes this",
      cards: [
        {
          type: "concept",
          id: "ethereum-to-the-rescue",
          label: "CONCEPT",
          title: "Ethereum to the rescue",
          body: "A system that no single group controls is the direct answer to the problems we just saw, and that's exactly what Ethereum is.\n\nYou've already met it as a computer no one owns. That one fact, that control isn't held by a small group, is what lets Ethereum solve the issues that arise in centralized systems.\n\nLet's take each of the three problems in turn and see how Ethereum handles it differently.",
        },
        {
          type: "concept",
          id: "fair-rule-making",
          label: "CONCEPT",
          title: "Fair rules, out in the open",
          body: "No single group owns Ethereum, so no single group gets to quietly write the rules in its own favor.\n\nThe rules are open for anyone to read, propose changes to, and debate. Changes happen out in the open, through public discussion and software that people freely choose to run, not behind the closed doors of a controlling few.\n\nThe result is a system whose rules are far better aligned with the people actually using it, because there's no hidden authority steering it somewhere else.",
        },
        {
          type: "concept",
          id: "rules-are-simple-and-concrete",
          label: "CONCEPT",
          title: "Rules you can read, that can't change in secret",
          body: "In Ethereum, the rules are written in code. Instead of books of confusing legal jargon, a few lines of code spell out exactly what can and can't happen, and almost anyone can learn to read them.\n\nBetter still, those rules can't be sneakily rewritten behind the scenes. Every change has to be published to the whole network in the open, where anyone can see exactly what was updated.\n\nSo you never have to wonder whether the rules quietly shifted while you weren't looking. What you see is what you get, and it stays that way unless a change is made out in the open.",
        },
      ],
    },
    {
      id: "more-than-money",
      title: "More than money",
      cards: [
        {
          type: "concept",
          id: "ethereum-vs-bitcoin",
          label: "CONCEPT",
          title: "More than digital money",
          body: "By now nearly everyone has heard of Bitcoin, the first successful decentralized money.\n\nLike Bitcoin, Ethereum lets people hold and move value without anyone calling the shots. But Ethereum has more to offer. Anyone can use the Ethereum world computer to program solutions to real-world problems.\n\nThose programmed solutions are self-governing: the rules are baked right into the code, running exactly as written, for everyone, all the time.",
        },
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts",
          illustrations: [VendingMachine],
          body: 'A **smart contract** is a program stored on Ethereum. Like a regular account, a contract has its own address and can store data.\n\nThe classic mental model is a vending machine. You put in the right coin, press a button, and the machine follows its rules. If the payment is valid, it releases the item, with nobody behind the counter deciding whether to serve you.\n\nOnce deployed, a contract\'s code is public for anyone to read, and it runs the same way every time. These little programs are the "few lines of code" that replace pages of legal jargon.',
        },
        {
          type: "concept",
          id: "what-people-build",
          label: "CONCEPT",
          title: "What people build",
          body: "Because smart contracts make Ethereum programmable, money is only one of the things people build on it. A few of the categories:\n\n- **Money and assets:** payments, savings, exchanges, and lending.\n- **Identity and social apps:** profiles, memberships, and reputation you can carry between apps.\n- **Games and digital objects:** items that can move beyond a single game's database.\n- **Coordination:** shared treasuries, fundraisers, tickets, and community decisions.\n\nNot every app needs Ethereum. Its advantage shows up when different people or apps need to share the same rules and records without handing one company complete control.",
        },
      ],
    },
    {
      id: "ether",
      title: "Ether",
      cards: [
        {
          type: "concept",
          id: "ether-as-money",
          label: "CONCEPT",
          title: "Ether as money",
          body: "Ether is the native currency of Ethereum. It lets users hold and transfer value to each other directly, without traditional banking systems acting as pesky middlemen.\n\nThat means transfers work the same at any hour and across any border. No company can stand between you and your money.\n\nEther can easily be traded for traditional currencies like dollars or euros using online exchange services.",
        },
        {
          type: "concept",
          id: "ether-as-a-power-source",
          label: "CONCEPT",
          title: "Ether as a power source",
          body: "Ether isn't only for sending value, it's also the valuable thing that powers the Ethereum network.\n\nEvery time you use the world computer, a small amount of Ether pays for the work being done. This fee is called **gas**, and we'll get into how it works a little later.\n\nFor now, the key idea is that the same Ether you can hold and send is also the fuel that keeps the whole system running.",
        },
      ],
    },
    {
      id: "accounts",
      title: "Accounts",
      cards: [
        {
          type: "concept",
          id: "accounts-101",
          label: "CONCEPT",
          title: "Accounts 101",
          body: "Ethereum accounts are somewhat like traditional bank accounts, they hold your Ether and let you send and receive it.\n\nBut an Ethereum account isn't stored on your device or controlled by some third-party company. Instead, each account is part of the Ethereum network itself.\n\nThat's what an account's **address** points to: where it lives on the network. Much like a traditional bank account number, the address is also how other people interact with your account. It's what they use to send you Ether.",
        },
        {
          type: "concept",
          id: "account-security",
          label: "CONCEPT",
          title: "Account security",
          body: "Opening an Ethereum account is much easier than opening a traditional bank account. Anyone can create one in a few clicks, without providing identification or asking anyone for permission.\n\nIt's a seamless system, but it raises an interesting question: how do you prove that you own an account?\n\nThat's where the **private key** comes in. A private key is a secret value assigned to each account when it's created. Knowing that secret is the **only** thing that proves you control the account.\n\n**Anyone** who knows your private key controls your account and can take your Ether. **Never** share your private key with anyone!",
        },
      ],
    },
    {
      id: "wallets",
      title: "Wallets",
      cards: [
        {
          type: "concept",
          id: "wallets-101",
          label: "CONCEPT",
          title: "Wallets 101",
          body: "Wallets are applications on your device that do two important jobs. First, they keep your private key secret. Second, they give you a safe way to do things on the Ethereum network, like transferring Ether.\n\nEthereum wallets aren't quite like their real-world namesakes. An Ethereum wallet holds your private key, **not** your Ether. Your Ether lives on the network; the wallet just holds the secret that proves the account is yours.\n\nLose that secret and you lose access, and there's usually no support desk that can get it back. That's why the next skill is knowing exactly what's safe to reveal.",
        },
        {
          type: "concept",
          id: "what-is-safe-to-share",
          label: "CONCEPT",
          title: "What is safe to share?",
          interactive: WalletSafety,
          body: "Your address is designed to be public, it's how people send you Ether. Your private key and recovery phrase are the opposite: they're secret, and a real app, support agent, or moderator should never need either one.\n\nSecrecy is only half the job, though. A wallet signature can authorize an action without ever revealing your key, so a careless approval can still cost you. Read what the wallet is asking before you confirm, and if a request is unclear, reject it and investigate.\n\nTry the interactive and decide which of the three is safe to share.",
        },
      ],
    },
    {
      id: "transactions-and-gas",
      title: "Transactions and gas",
      cards: [
        {
          type: "concept",
          id: "interacting-with-ethereum",
          label: "CONCEPT",
          title: "Interacting with Ethereum",
          illustrations: [TransactionLifecycle],
          interactive: TransactionJourney,
          body: "You've met the account that holds your funds and the wallet that guards your key. Now for the part that makes something actually happen: the **transaction**.\n\nA transaction is a signed instruction that asks the Ethereum network to do something for you. The simplest one is exactly what it sounds like: send Ether to someone else, just like a bank transfer. But that's only the start — you can also use transactions to interact with the smart contracts running on the network, doing things like voting on a proposal, buying an item in a game, or joining a fundraiser.\n\nWhatever the action, the flow is the same: your wallet signs it with your private key, broadcasts it to the network, and the nodes check it. If it follows the rules, the change is recorded permanently. Transactions are bundled into **blocks**, added one after another to form the **blockchain**.\n\nBut making the network do this work comes at a price, which brings us to the final piece: **gas**.",
        },
        {
          type: "concept",
          id: "gas",
          label: "CONCEPT",
          title: "Gas",
          body: "Making the network do work for you isn't free: it requires paying a small **gas** fee in Ether. Remember Ether's second role, as the fuel that powers the network? This is it.\n\nWe pay gas because the global network of nodes is doing real work, and they need to be paid for their effort. Computer hardware, electricity, and network access aren't free.\n\nGas also keeps the network healthy: because every action costs something, nobody can flood it with junk for free. Bigger actions cost more gas, and you pay even if the action fails, so it pays to understand what you're signing.",
        },
      ],
    },
    {
      id: "recap",
      title: "Putting it all together",
      cards: [
        {
          type: "question",
          id: "explain-ethereum",
          label: "QUESTION",
          title: "Explain Ethereum to a friend",
          question:
            "A friend says, “Ethereum is basically an online bank for crypto.” Using what you've learned, how would you correct that picture? Touch on what Ethereum actually is, one problem with the traditional system that it improves on, and what happens when someone confirms an action in their wallet.",
          rubricConcepts: [
            "Ethereum is a public network run by thousands of independent nodes that no single group controls, not a bank or company",
            "the traditional system puts a small group in charge of rules that can be selfish, too complex to follow, or changed in secret",
            "Ethereum's rules are open, readable code that runs the same for everyone and can't be quietly rewritten",
            "a wallet signs a transaction with your private key; the network checks it and records it permanently for a small gas fee",
            "Ethereum is programmable, so it's more than money — people also build social apps, games, and coordination tools on it",
          ],
          hints: [
            "Start with the opening idea: a computer no one owns. What keeps all those nodes in sync?",
            "Bring in the problems with the traditional system, and how open, code-based rules answer them.",
            "Finish by following one action from the wallet's Confirm button all the way to a permanent record.",
          ],
        },
        {
          type: "summary",
          id: "the-big-picture",
          label: "SUMMARY",
          title: "You've got the big picture",
          body: "You started with a computer no one owns and ended with a real mental model of how Ethereum works.\n\nAlong the way you saw **why** it exists. The traditional system puts a small group in charge of rules that can be selfish, too complex to follow, or changed in secret. Ethereum answers each of those with open, code-based rules that anyone can read and that can't be quietly rewritten.\n\nYou also met the pieces you'll actually use:\n\n- **Ether (ETH)** — the network's money, and the **gas** that pays for every action.\n- **Smart contracts** — small programs that run their rules automatically, the same way every time.\n- **Accounts** — your place on the network, identified by a public **address**.\n- **Private keys** — the secret that controls an account. Never share it.\n- **Wallets** — the apps that guard your key and let you act safely.\n- **Transactions** — how you ask the network to do something, recorded permanently once included.\n\nA few things to always keep in mind: activity is public by default, confirmed actions are hard to reverse, and your keys are yours alone to protect. Next up: a whole lab on wallets and how to use one safely.",
        },
      ],
    },
  ],
});
