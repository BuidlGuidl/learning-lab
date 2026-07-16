import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V2 — blank-slate rebuild of the ethereum-101 curriculum.

// TODO: Add marked .sol sources under contracts/ and run `yarn gen:labs` when the first code exercise lands.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v2",
  title: "Ethereum 101 V2",
  overview:
    "Introduces the learner to the basics of Ethereum, what issues is solves, and basic concepts like accounts, wallets, and transactions.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "centralized-banking-issues",
      title: "Issues of centralized banking",
      cards: [
        {
          type: "concept",
          id: "the-status-quo",
          label: "CONCEPT",
          title: "The status quo",
          body: "We all have experience using the traditional centralized banking system. For the most part, it seems to work great. We can easily move our funds and receive loans to finance things that we couldn't otherwise afford.\n\nIn reality, the centralized nature of the traditional system means that rule making and enforcement are handled by a small group. This regulatory and enforcement chokepoint creates several issues that we don't often think about. Let's look at a few in the next sections.",
        },
        {
          type: "concept",
          id: "selfish-rule-making",
          label: "CONCEPT",
          title: "Selfish rule making",
          body: "The rules created by centralized regulators are advertised as being unbiased and fair for all users. But is that always the case?\n\nIt's easy to see how those making the rules might be tempted to stack them in their own favor and that unfortunately has happened.\n\nOne of the most well known examples was the 2008 financial crisis and bank bailout. Banks made reckless bets that should have resulted in their bankruptcy, but selfish regulations gave them unfair help at the expense of the users. The banks kept going like nothing happened while ordinary people lost their homes and jobs.",
        },
        {
          type: "concept",
          id: "rules-are-complex",
          label: "CONCEPT",
          title: "Rules are complex",
          body: "The regulations running the traditional centralized banking system are very complex. Gaining the knowledge required to understand exactly what is going on takes years of specialized education.\n\nThe average user of the system simply does not have the training or time required to truly understand these rules and regulations. This means we're using the system on blind faith! We trust that everything is ok behind the scenes.",
        },
        {
          type: "concept",
          id: "rules-are-fluid",
          label: "CONCEPT",
          title: "Rules are fluid",
          body: "The rules running traditional banking systems are fluid and are constantly being tweaked or re-written. The fluid nature of regulations may be a requirement for keeping the system running in an ever-changing world, but it creates an issue.\n\nThe rules that users think they are playing by can change without them even knowing anything is different. That's not a great way to maintain trust in the system!",
        },
      ],
    },
    {
      id: "decentralization-solution",
      title: "Decentralization as a solution",
      cards: [
        {
          type: "concept",
          id: "ethereum-to-the-rescue",
          label: "CONCEPT",
          title: "Ethereum to the rescue",
          body: "A decentralized financial system that no one group controls solves the issues highlighted in the previous section. That's where Ethereum comes in!\n\nEthereum is a decentralized digital banking system that has solutions to the problems that arise in centralized financial systems. Let's quickly look at a few of the most important advantages.",
        },
        {
          type: "concept",
          id: "fair-rule-making",
          label: "CONCEPT",
          title: "Fair rule making",
          body: "Every Ethereum user has the opportunity to contribute to rule making. Everyone has a vote in this decentralized system. Rules are much better aligned to the wants and needs of the average Ethereum user because that's who's deciding how the system works!",
        },
        {
          type: "concept",
          id: "rules-are-simple",
          label: "CONCEPT",
          title: "Rules are simple",
          body: "In Ethereum, rules are defined in code. Almost anyone can understand how the regulations work with a little bit of learning.\n\nA few lines of regulatory code are much more transparent than the books of confusing legal jargon that govern the traditional banking system.",
        },
        {
          type: "concept",
          id: "rules-are-concrete",
          label: "CONCEPT",
          title: "Rules are concrete",
          body: "The code-defined rules that run Ethereum cannot be sneakily changed behind the scenes. Every change must be published to the network, and anyone can easily see what has been updated. This means you never have to wonder whether the rules quietly shifted while you weren't looking.\n\nWhat you see is what you get, and it stays that way unless a change is made out in the open.",
        },
      ],
    },
    {
      id: "how-ethereum-is-unique",
      title: "How Ethereum is unique",
      cards: [
        {
          type: "concept",
          id: "a-closer-look",
          label: "CONCEPT",
          title: "A closer look",
          body: "The previous section made a pitch for why the decentralized Ethereum system is better for its users compared to centralized banking systems.\n\nLet's look a little closer at how Ethereum can work without a centralized group calling all the shots and how Ethereum differs from other decentralized systems.",
        },
        {
          type: "concept",
          id: "the-world-computer",
          label: "CONCEPT",
          title: "The World Computer",
          body: "Ethereum is powered by thousands of independent computers around the world, called **nodes**. Together, those nodes act as one shared computer.\n\nEvery node keeps its own copy of the exact same record. When something changes, every node runs the same check on its own copy, and they all agree on a single shared history.\n\nThe duplicated effort is the point: because everyone verifies the work independently, no one has to trust a central authority!",
        },
        {
          type: "concept",
          id: "ethereum-vs-bitcoin",
          label: "CONCEPT",
          title: "Ethereum vs. Bitcoin",
          body: "At this point, nearly everyone has heard of Bitcoin, the first successful decentralized banking system.\n\nLike Bitcoin, Ethereum allows users to do banking without anyone calling the shots, but Ethereum has even more to offer. Anyone can use the Ethereum World Computer to program solutions to real-world problems!\n\nThose programmed solutions are self-governing: the rules are baked into the code itself!",
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
          body: "Ether is the native currency of Ethereum. It allows users to hold and transfer value to each other directly without traditional banking systems acting as pesky middlemen.\n\nThat means transfers work the same at any hour and across any border. No company can stand between you and your money.\n\nEther can easily be traded for traditional fiat currencies like dollars or euros, using online exchange services.",
        },
        {
          type: "concept",
          id: "ether-as-a-power-source",
          label: "CONCEPT",
          title: "Ether as a power source",
          body: "Ether isn't only for sending value — it's also the valuable thing that powers the Ethereum network.\n\nEvery time you use the World Computer, a small amount of Ether pays for the work being done. This fee is called **gas**, and we'll get into how it works a little later.\n\nFor now, the key idea is that the same Ether you can hold and send is also the fuel that keeps the whole system running.",
        },
      ],
    },
    {
      id: "ethereum-accounts",
      title: "Ethereum accounts",
      cards: [
        {
          type: "concept",
          id: "accounts-101",
          label: "CONCEPT",
          title: "Accounts 101",
          body: "Ethereum accounts are somewhat like traditional bank accounts — they hold your Ether and let you send and receive it.\n\nAn Ethereum account is not stored locally on your device or controlled by some random third-party entity. Instead, each account is part of the Ethereum network itself.\n\nThat's what an account's **address** points to: where it lives on the network. Much like a traditional bank account number, the address is also how other people interact with your account. It's what they use to send you Ether.",
        },
        {
          type: "concept",
          id: "account-security",
          label: "CONCEPT",
          title: "Account Security",
          body: "Opening an Ethereum account is much easier than opening a traditional bank account. Anyone can easily create a new Ethereum account in a few clicks without providing any identification or asking anyone for permission.\n\nIt's a pretty seamless system, but it brings up an interesting question: how do you prove that you own an account?\n\nThat's where the **private key** comes in. Private keys are secret values assigned to each account when it is created.\n\nKnowing that secret value is the **only** thing that proves you control an account. **Anyone** who knows your private key controls your account and can steal your Ether! **Never** share your private key with anyone!",
        },
      ],
    },
    {
      id: "wallets",
      title: "Wallets",
      cards: [
        {
          type: "concept",
          id: "blank-slate",
          label: "CONCEPT",
          title: "Wallets 101",
          body: "Wallets are applications on your device that do two important jobs. First, they are responsible for keeping your private key secret. Second, they give you a secure way to do things on the Ethereum network (like transferring Ether).\n\nNote that Ethereum wallets are not exactly like their real-world counterparts. Ethereum wallets hold your private key, **not** your Ether.\n\nWant to know more about wallets and how to use them? Check out the next lab!",
        },
      ],
    },
    {
      id: "transactions-and-gas",
      title: "Transactions and gas",
      cards: [
        {
          type: "concept",
          id: "ethereum-transactions",
          label: "CONCEPT",
          title: "Ethereum transactions",
          body: "A transaction is how you interact with the Ethereum network and ask it to do something for you.\n\nThe most basic transaction type you can do is exactly what it sounds like: send Ether to someone else (just like a traditional banking transaction). But that's just the start!\n\nYou can use transactions to interact with the programs running on the Ethereum network to do things like vote on a community proposal or play a game on the network.",
        },
        {
          type: "concept",
          id: "gas",
          label: "CONCEPT",
          title: "Gas",
          body: 'Using transactions to make the network do work for you is not free: it requires paying a small **gas** fee in Ether. Remember Ether\'s second role from the "Ether" section?\n\nUsers have to pay gas because the global network of nodes is doing real work, and they need to be paid for their effort. Computer hardware, electricity, and network access are not free!',
        },
      ],
    },
    {
      id: "applications-of-ethereum",
      title: "Applications of Ethereum",
      cards: [
        {
          type: "concept",
          id: "cool-projects",
          label: "CONCEPT",
          title: "Cool projects",
          body: "[Need good examples of flashy projects that aren't too complex or have negative feelings associated with them]",
        },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      cards: [
        {
          type: "concept",
          id: "summary-and-next-steps",
          label: "CONCEPT",
          title: "Summary and next steps",
          body: "[Need a summary of the lab and call to action for the next lab]",
        },
      ],
    },
  ],
});
