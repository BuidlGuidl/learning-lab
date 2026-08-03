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
          body: "Most apps you use live on servers owned by one company. **Ethereum** is different: it runs on thousands of independent computers around the world, called **nodes**.\n\nBy all working together, those nodes form a **decentralized** network that acts as one shared computer. Each node keeps its own copy of the same record that determines who owns what, and which programs are running.\n\nWhen something changes, every node checks it for itself, and they all land on the same shared history. That duplicated effort is the point. No one has to be blindly trusted because everyone is verifying the same work. If someone tried to lie, it would be immediately obvious.\n\nThe decentralized nature of the node network means there's no single point of failure. It's not an issue if a few nodes go down because the rest of the network can easily pick up the slack. The Ethereum network has run nonstop since it launched in 2015, thanks to its failure-resistant design.",
        },
        {
          type: "concept",
          id: "why-decentralization-matters",
          label: "CONCEPT",
          title: "Why decentralization matters",
          body: "Plenty of things run fine with a single company or a small centralized group in charge. Why go to the trouble of building a different kind of system? Turns out that decentralization has some very important advantages for users.\n\nStart with the rules. Ethereum's rules are public. Anyone can read exactly what's allowed and what isn't.\n\nThey apply to everyone equally. And they can't be changed quietly: every change happens in the open, where the whole network can see it.\n\nAnd there's no administrator behind the scenes. No one can freeze your account, block an action the rules allow, or rewrite what already happened.\n\nHold on to those three properties. Later, you'll weigh something very familiar against them.\n\n[Note: this content is repeated in section 3: 'Why not just use a bank?'. Not sure the best way to solve this. This card could be a different topic and Section 3 could be moved up to be next. Probably makes more sense to change the point of this card and leave section 3 where it is. It has an ok flow with 'what is ethereum' -> 'ethereum is than money' -> 'why ethereum as money has advantages over banks']\n\n[Interactive/image/game to be added]",
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
          body: "You've almost certainly heard of **Bitcoin**. It proved that money can move from person to person, anywhere on Earth, with no middleman in between.\n\nEthereum does that too but it adds something else groundbreaking: the ability to run programs designed by anyone.\n\nA shared computer that only tracks money is useful. A shared computer that runs code can become almost anything.\n\nThose programs are called smart contracts.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts",
          illustrations: [VendingMachine],
          body: "A **smart contract** is a program that runs on the Ethereum network. You can think of a smart contract as a sort of digital vending machine. You insert the coin, press a button, and get the item you paid for. There's no person behind the counter deciding whether to serve you. The machine just follows its rules.\n\nA smart contract's coded rules are public so every user can read the code and understand exactly what the smart contract does. Because smart contracts run on a shared, decentralized network, no one can change the rules without showing everyone that something is different. [needs a follow up about why that's good] \n\nSo what do people actually build with a computer like this?",
        },
        {
          type: "concept",
          id: "what-people-build",
          label: "CONCEPT",
          title: "What people build",
          body: "Ethereum already has a storied history of people coding inventive ways of solving real-world problems. Here are some types of Ethereum solutions that go beyond holding and transferring money:\n\n- **DeFi** (Decentralized Finance): borrowing, lending, and trading run by programs instead of firms.\n- **Stablecoins**: tokens that match the value of a fiat currency like the dollar.\n- **NFTs** (Non-Fungible Tokens): unique digital objects you truly own: art, game items, tickets, memberships.\n- **DAOs** (Decentralized Autonomous Organizations): internet-native co-ops where every member has a vote on how the organization runs.\n- Plus games, identity solutions, and plenty of other exciting things being invented every day!\n\nNot every app needs Ethereum. It shines when strangers need shared rules and shared records without handing one company control.\n\nThe most familiar one-company-in-control system of all is the one holding your paycheck.\n\n[Interactive/image/game to be added]",
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
          body: "Banks mostly work. Cards swipe, checks clear, loans put people in homes. You probably used the system today without a second thought.\n\nThe catch is structural, not a villain story. The rules of that system are written by a small group, and they run to thousands of pages of legal and regulatory language. Realistically, no one outside that group reads them.\n\nSo you use the system on faith, not because you checked the rules and liked them, but because checking was never really an option.\n\nFaith might be fine if the rules held still. Do they?\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "rules-can-change-on-you",
          label: "CONCEPT",
          title: "And the rules can change on you",
          body: "The rules you're taking on faith are also a moving target. Terms update, policies shift, and what you thought you agreed to can be different by the time you look again.\n\nSometimes the changes have favored the people closest to the system (the 2008 bank bailouts are the best-known example).\n\nAnd the gatekeepers are real. An institution can freeze an account, decline a payment, or revoke access, at its own discretion.\n\nNow weigh that against what you already know. On Ethereum the rules are public, and they only change in the open. They run as code, the same for everyone, every time. And there's no administrator with a freeze button.\n\n[Interactive/image/game to be added]",
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
          body: "**Ether (ETH)** is Ethereum's built-in currency. You can hold it and send it to anyone, anywhere.\n\nExchanges let you trade between ETH and currencies like dollars or euros.\n\nETH also pays transaction fees, which the gas card covers.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "accounts-and-addresses",
          label: "CONCEPT",
          title: "Accounts and addresses",
          body: "An Ethereum **account** holds ETH and lets you perform actions on the network. Accounts live on the network itself, not on your phone or laptop.\n\nEvery account has an **address**: its public name, a bit like a bank account number. It's what people use to send you ETH, and it's safe to share.\n\nAnyone can create an account in seconds. No paperwork, no ID, no permission. The network doesn't even ask for your name! Which leaves a puzzle: if no authority signed you up, how do you prove an account is yours?\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "the-private-key",
          label: "CONCEPT",
          title: "The private key",
          body: "Every account has a **private key**: a very large secret number. That secret is the **entire** proof of ownership. There's no manager to help you, no password reset, no ID check. No one is holding this account for you. Whoever knows the key controls the account.\n\nThat cuts both ways. No bureaucracy can ever lock you out but anyone who knows your key can take everything your account holds. **Never share your key with anyone, under any circumstance!**\n\nCould someone just guess your key? Try it yourself: crack a short key below, then see how far you get against a real one.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "wallets",
          label: "CONCEPT",
          title: "Wallets",
          body: "Nobody types a giant secret number by hand. That's what a **wallet** is for. It's an app on your device with two jobs: keep your private key secret, and put it to work safely when you use the network.\n\nAn Ethereum wallet differs from a physical wallet in an important way: Ethereum wallets hold your key (the thing that securely allows you to control your money) not your money (ETH) itself. Your ETH stays on the network, with the rest of your account.\n\nYour wallet also hands you a **recovery phrase**: your key's backup, written as a short list of ordinary words. Your recovery phrase holds just as much power as your private key so carefully guard both.\n\nThere's a whole lab on wallets coming next. Before that, learn what's safe to reveal.\n\n[Interactive/image/game to be added]",
        },
        {
          type: "concept",
          id: "what-is-safe-to-share",
          label: "CONCEPT",
          title: "What's safe to share?",
          interactive: WalletSafety,
          body: "The rule is short.\n\nYour **address**? Public by design. Share it freely.\n\nYour **private key** or **recovery phrase**? Never. No real app, support agent, or moderator will ever need them. Anyone who asks is trying to rob you.\n\nOne more edge to know about: a wallet signature can authorize an action without revealing your key. Signatures keep the key safe, but they still do things. Read what you're approving, and if it's unclear, reject it.\n\nProve it to yourself below: which of the three is safe to share?",
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
          body: "So how do you actually make something happen on the network?\n\nEverything you do on Ethereum starts as a **transaction**: an instruction signed with your key that asks the network to act. The simplest kind sends ETH from your address to another (just like a banking transaction).\n\nTransactions can do so much more than transfer ETH. They're the interaction that allows you to vote on a proposal, buy a game item, join a fundraiser, or do anything else that smart contracts allow.\n\nThe flow never changes: your wallet signs the instruction with your private key and broadcasts it to the network. Nodes then check it against the rules. If it passes, your requested instructions are carried out.\n\nThousands of machines are performing real work to execute your transaction, and that has a price.\n\n[Moved the transaction lifestyle and TransactionJourney interaction to next card]",
        },
        {
          type: "concept",
          id: "gas",
          label: "CONCEPT",
          title: "Gas",
          illustrations: [TransactionLifecycle],
          interactive: TransactionJourney,
          body: "You must pay a small fee in ETH, called **gas**, to have the network carry out your transaction.\n\nNodes are physical machines that consume electricity and bandwidth on every action, so using the network can't be free. Gas compensates nodes for the costs they accrue running the network.\n\nThe gas fee also protects the network from spam. It's just not worth it to flood the network with junk if a bad actor has to pay for every bad transaction.\n\nThe gas fee is not a fixed amount. A simple transaction will cost pocket change, but bigger actions cost more. The gas price also fluctuates with network activity. More activity means more competition for the nodes' labor.\n\nGas fees are charged even if your transaction fails, because the network still did the work of checking it. That's one more reason to understand exactly what your transaction is doing before you sign it.\n\nEthereum's energy use fell by about 99% in 2022, when it switched to a system called proof of stake, but that's a story for a later lab.\n\n[The TransactionLifecycle illustration is presented too early. It's talking about block that aren't introduced until next card.]",
        },
        {
          type: "concept",
          id: "the-blockchain",
          label: "CONCEPT",
          title: "The Blockchain",
          illustrations: [PublicLedger],
          body: "Where does a confirmed transaction end up? In the record, permanently.\n\nConfirmed transactions are bundled into **blocks**, and each block is added after the last, forming a single chain: the **blockchain**. That's the shared history every node keeps, the record you met in the very first card.\n\nTwo consequences are worth internalizing now.\n\nFirst: activity is public by default. Anyone who knows your address can see your account balance and its entire history.\n\nSecond: confirmed actions are forever. There's no chargeback line, no undo, and no one to appeal to.\n\nBoth are features with sharp edges. The permanence that stops anyone from rewriting history is the same permanence that makes your mistakes stick.",
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
            "Ethereum is run by thousands of independent computers (nodes) that each verify and agree on one shared history, not by a company",
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
          body: "Ethereum is a shared computer run by thousands of machines that no company owns. Because it runs programs, it hosts far more than payments. Unlike the system you grew up with, no small group writes its rules or holds your money. You hold your own keys. And when you act, a signed transaction pays a small fee and lands in the permanent public record.\n\nThe terms you now own:\n\n- **Node**: one of the thousands of computers running Ethereum, each keeping a copy of the shared history.\n- **Smart contract**: a program on Ethereum: public code that runs the same for everyone.\n- **ETH**: the network's built-in money, and what pays for every action.\n- **Address**: your account's public name. Safe to share.\n- **Private key**: the secret number that is control of your account. **Never share it.**\n- **Wallet**: the app that guards your key and signs for you.\n- **Transaction**: a signed instruction asking the network to act.\n- **Gas**: the small fee every action pays for the network's work.\n- **Block / blockchain**: confirmed transactions, bundled and chained into the permanent record.\n\nNext up: a whole lab on wallets. Down the road: transactions under the hood, staking and how the network agrees, and eventually writing your own smart contracts.\n\n[This card needs more eyes. I did a first pass but it's still weird.]",
        },
      ],
    },
  ],
});
