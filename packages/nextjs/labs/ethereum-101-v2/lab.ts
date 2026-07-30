import { TransactionJourney } from "./assets/TransactionJourney";
import { VendingMachine } from "./assets/VendingMachine";
import { WalletSafety } from "./assets/WalletSafety";
import { WorldComputer } from "./assets/WorldComputer";
import { PublicLedger, StateNetwork, TransactionLifecycle } from "./assets/illustrations";
import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Ethereum 101 V2 — the non-technical rebuild agreed in issue #59 / PR #63.
//
// OUTLINE.md next to this file is the structural source of truth: 6 sections,
// 18 cards, one home per concept, later mentions are one-line callbacks only.
// Copy style follows the original Ethereum 101 lab and ethereum.org/learn:
// short sentences, second person, honest tone, each term bolded and defined
// once at its home card.
//
// Cards that don't yet have an interactive, image, or game end with an
// "[Interactive/image/game to be added]" placeholder line.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v2",
  title: "Ethereum 101 V2",
  overview:
    "The non-technical introduction to Ethereum: what it is, what it can do, why it isn't a bank, how you hold your own money, and how you use it.",
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
          body: "Most apps you use live on servers owned by one company. **Ethereum** is different: it runs on thousands of independent computers around the world, called **nodes**.\n\nTogether, those nodes act as one shared computer. Each keeps its own copy of the same record — who owns what, and which programs are running.\n\nWhen something changes, every node checks it for itself, and they all land on the same shared history. That duplicated effort is the point, twice over. Because everyone verifies, no one has to be trusted. And because copies live everywhere, there's no plug to pull — the machine has run nonstop since it launched in 2015.\n\nNo company owns it. What that actually buys you is next.",
        },
        {
          type: "concept",
          id: "why-no-one-in-charge-matters",
          label: "CONCEPT",
          title: 'Why "no one in charge" matters',
          body: "Plenty of things run fine with a company in charge. So what does a computer with no owner actually get you?\n\nStart with the rules. Ethereum's rules are public — anyone can read exactly what's allowed and what isn't.\n\nThey apply to everyone equally. And they can't be changed quietly: every change happens in the open, where the whole network can see it.\n\nAnd there's no administrator behind the scenes. No one can freeze your account, block an action the rules allow, or rewrite what already happened.\n\nHold on to those three properties. Later, you'll weigh something very familiar against them.\n\n[Interactive/image/game to be added]",
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
          body: "You've almost certainly heard of **Bitcoin**. It proved something remarkable: money can move from person to person, anywhere on Earth, with no middleman in between.\n\nEthereum does that too. Then it adds one thing — it can also run programs.\n\nThat single difference is where everything else in this lab comes from. A shared computer that only tracks money is useful. A shared computer that runs code can become almost anything.\n\nThose programs have a name — and a surprisingly good mental model.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts",
          illustrations: [VendingMachine],
          body: "A **smart contract** is a program stored on Ethereum, with its own address on the network.\n\nThe mental model is a vending machine. Right coin in, button pressed, item out — no person behind the counter deciding whether to serve you. The machine just follows its rules.\n\nOnce deployed, a smart contract's code is public, and it runs the same way every time, for everyone. Those rules anyone can read? This is what they look like in practice.\n\nSo what do people actually build with a computer like this?",
        },
        {
          type: "concept",
          id: "what-people-build",
          label: "CONCEPT",
          title: "What people build — and the buzzwords",
          body: "Money is just the start. Here's the landscape in plain words — and the buzzwords you'll hear for each part of it:\n\n- **Payments and savings** — hold money and send it, worldwide, around the clock.\n- **DeFi** — borrowing, lending, and trading run by programs instead of firms.\n- **Stablecoins** — tokens designed to hold steady against the dollar.\n- **NFTs** — digital objects you truly own: art, game items, tickets, memberships.\n- **DAOs** — internet-native co-ops, where members vote on a shared treasury.\n- Plus games, identity, and plenty still being invented.\n\nAn honest note: not every app needs Ethereum. It shines when strangers need shared rules and shared records without handing one company control.\n\nWhich points at a fair question. The most familiar one-company-in-control system of all is the one holding your paycheck.\n\n[Interactive/image/game to be added]",
        },
      ],
    },
    {
      id: "why-not-just-use-a-bank",
      title: "Why not just use a bank?",
      cards: [
        {
          type: "concept",
          id: "the-system-we-grew-up-with",
          label: "CONCEPT",
          title: "The system we all grew up with",
          body: "Let's be fair to banks: they mostly work. Cards swipe, checks clear, loans put people in homes. You probably used the system today without a second thought.\n\nThe catch is structural, not a villain story. The rules of that system are written by a small group, and they run to thousands of pages of legal and regulatory language. Realistically, no one outside that group reads them.\n\nSo you use the system on faith — not because you checked the rules and liked them, but because checking was never really an option.\n\nFaith might be fine if the rules held still. Do they?\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "rules-can-change-on-you",
          label: "CONCEPT",
          title: "And the rules can change on you",
          body: "The rules you're taking on faith are also a moving target. Terms update, policies shift, and what you thought you agreed to can be different by the time you look again.\n\nSometimes the changes have favored the people closest to the system — the 2008 bank bailouts being the best-known example.\n\nAnd the gatekeepers are real. An institution can freeze an account, decline a payment, or revoke access, at its own discretion.\n\nNow weigh that against what you already know. On Ethereum the rules are public, and they only change in the open. They run as code, the same for everyone, every time. And there's no administrator with a freeze button.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "who-holds-your-money",
          label: "CONCEPT",
          title: "Who holds your money?",
          body: "One difference runs deeper than any rule: who actually holds the money.\n\nAt a bank, \"your\" account is an entry in the bank's ledger. The bank holds the money on your behalf, and every path to it runs through them. That arrangement is called **custody**: they have it, you have a claim on it.\n\nEthereum has no one to hold it for you. You hold the keys to your own money, directly. That's real freedom and real responsibility in the same sentence.\n\nHolding your own keys is a skill with real stakes, and it's a skill you can learn. The next section is exactly that toolkit: the money, the account, the key, and the app that manages them.\n\n[Interactive/image/game to be added]",
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
          body: "First, the money itself. **Ether (ETH)** is Ethereum's built-in currency. You can hold it, and you can send it to anyone, anywhere, at any hour of any day — with no one in the middle to wait on.\n\nETH trades against dollars, euros, and other currencies on exchanges, which is how most people first get some.\n\nAnd file this away for later: ETH is also what pays the network for its work. That story lands in a few cards, when we get to gas.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "accounts-and-addresses",
          label: "CONCEPT",
          title: "Accounts and addresses",
          body: "To hold ETH you need an **account**. An account holds your balance and lets you act on the network — and here's the part that surprises people: it lives on the network itself, not on your phone or laptop.\n\nEvery account has an **address**: its public name, a bit like an account number. It's what people use to send you ETH, and it's safe to share.\n\nAnyone can create an account in seconds. No paperwork, no ID, no permission — the network doesn't even ask your name.\n\nSharing your address can never cost you money. What the world can see through a shared address is a different thread — one we'll pick up at the permanent record.\n\nWhich leaves a puzzle: if no authority signed you up, how do you prove an account is yours?\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "the-private-key",
          label: "CONCEPT",
          title: "The private key",
          body: "Every account is created together with a **private key**: a very large secret number.\n\nThat secret is the entire proof of ownership. There's no manager to vouch for you, no password reset, no ID check — no one is holding this account for you. Whoever knows the key controls the account.\n\nThat cuts both ways. No bureaucracy can ever lock you out — and anyone who learns your key can take everything the account holds. **Never share it.**\n\nCould someone just guess it? Try it yourself: crack a short key below, then see how far you get against a real one.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "wallets",
          label: "CONCEPT",
          title: "Wallets",
          body: "Nobody types a giant secret number by hand. That's what a **wallet** is for: an app on your device with two jobs — keep your private key secret, and put it to work safely when you act: sending ETH, approving actions.\n\nThe name is misleading in one way: a wallet holds your key, not your ETH. Your ETH stays on the network, with the rest of your account.\n\nYour wallet also hands you a **recovery phrase**: your key's backup, written as a short list of ordinary words. Guard it like the key itself — lose both, and there's no support desk to call.\n\nThere's a whole lab on wallets coming next. Before that, one skill matters more than any other: knowing exactly what's safe to reveal.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "what-is-safe-to-share",
          label: "CONCEPT",
          title: "What's safe to share?",
          interactive: WalletSafety,
          body: "The rule is short.\n\nYour **address**? Public by design — share it freely.\n\nYour **private key** or **recovery phrase**? Never. No real app, support agent, or moderator will ever need them. Anyone who asks is trying to rob you.\n\nOne more edge to know about: a wallet signature can authorize an action without revealing your key. Signatures keep the key safe — but they still do things. Read what you're approving, and if it's unclear, reject it.\n\nProve it to yourself below: which of the three is safe to share?",
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
          body: "You have money, an account, a key, and a wallet. Time to make something happen.\n\nEverything you do on Ethereum starts as a **transaction**: a signed instruction asking the network to act. The simplest kind sends ETH from your address to another.\n\nThe same mechanism drives everything else. Vote on a proposal, buy an item in a game, join a fundraiser — each one is a transaction aimed at a smart contract instead of a person.\n\nThe flow never changes: your wallet signs the instruction with your private key and broadcasts it. The nodes check it against the rules. If it passes, it takes effect.\n\nThousands of machines just did work on your behalf — and that has a price.",
        },
        {
          type: "concept",
          id: "gas",
          label: "CONCEPT",
          title: "Gas",
          body: "The price is called **gas**: a small fee, paid in ETH, attached to every transaction. This is the job we filed away at the Ether card — ETH pays the network for its work.\n\nThe fee exists because the work is real. Nodes are physical machines spending hardware, electricity, and bandwidth on every action, so using the network can't be free — every action covers its own cost.\n\nThe fee has a second job: because every action costs something, nobody can flood the network with junk for free.\n\nHow big is it? Usually pocket change for a simple send, but never fixed: bigger actions cost more, and the price floats up when the network is busy and drifts back down when it's quiet.\n\nOne sharp edge: the fee is charged even if your action fails, because the network still did the work of checking it. One more reason to read before you sign.\n\nAnd one aside for the environmentally minded: Ethereum's energy use fell by about 99% in 2022, when it switched to a system called proof of stake — a story for a later lab.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "written-in-stone",
          label: "CONCEPT",
          title: "Written in stone",
          illustrations: [PublicLedger],
          body: "Where does a confirmed transaction end up? In the record — permanently.\n\nConfirmed transactions are bundled into **blocks**, and each block is added after the last, forming a single chain: the **blockchain**. That's the shared history every node keeps — the record you met in the very first card.\n\nTwo consequences are worth internalizing now.\n\nFirst: activity is public by default. Here's the thread from the accounts card — anyone who knows your address can see its balance and its entire history. They can never take anything with it. But they can watch.\n\nSecond: confirmed actions are effectively irreversible. There's no chargeback line, no undo, no one to appeal to.\n\nBoth are features with sharp edges. The permanence that stops anyone from rewriting history is the same permanence that makes your mistakes stick.",
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
            "A friend hears you've been learning about Ethereum and says: \"So it's basically an online bank for crypto, right?\" Set the picture straight in your own words. What actually runs Ethereum? What can it do that a bank app can't? And what happens between you pressing Confirm and the action becoming permanent?",
          rubricConcepts: [
            "Ethereum is run by thousands of independent computers (nodes) that each verify and agree on one shared history — not by a company",
            "it runs programs (smart contracts), so it hosts apps beyond payments",
            "an action is a transaction: the wallet signs it with your private key, the nodes check it, and it lands permanently on the blockchain",
            "every action pays a small gas fee, which covers the network's work and keeps spam out",
            "unlike a bank, no small group can rewrite the rules or freeze you out, and you hold your own keys instead of trusting a custodian",
          ],
          hints: [
            "Start with who runs the machine: how many computers, and who owns them?",
            "Remember what the vending machine stood for.",
            "At a bank, someone holds your money for you. Who holds it here?",
            "Trace one action end to end: sign, broadcast, check, record.",
          ],
        },
        {
          type: "summary",
          id: "summary-what-is-next",
          label: "SUMMARY",
          title: "The big picture, and what's next",
          body: "The whole arc in one breath: Ethereum is a shared computer run by thousands of machines that no company owns. Because it runs programs, it hosts far more than payments. Unlike the system you grew up with, no small group writes its rules or holds your money — you hold your own keys. And when you act, a signed transaction pays a small fee and lands in the permanent public record.\n\nThe terms you now own:\n\n- **Node** — one of the thousands of computers running Ethereum, each keeping a copy of the shared history.\n- **Smart contract** — a program on Ethereum: public code that runs the same for everyone.\n- **ETH** — the network's built-in money, and what pays for every action.\n- **Address** — your account's public name. Safe to share.\n- **Private key** — the secret number that is control of your account. Never share it.\n- **Wallet** — the app that guards your key and signs for you.\n- **Transaction** — a signed instruction asking the network to act.\n- **Gas** — the small fee every action pays for the network's work.\n- **Block / blockchain** — confirmed transactions, bundled and chained into the permanent record.\n\nThe safety refrain, one last time: public by default, hard to reverse, and your key is yours alone.\n\nNext up: a whole lab on wallets. Down the road: transactions under the hood, staking and how the network agrees, and eventually writing your own smart contracts.",
        },
      ],
    },
  ],
});
