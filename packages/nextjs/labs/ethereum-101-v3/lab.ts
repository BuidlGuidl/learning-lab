import { VendingMachine } from "../ethereum-101/assets/VendingMachine";
import { ContractRules } from "./assets/ContractRules";
import { OpenCommunity } from "./assets/OpenCommunity";
import { PortableIdentity } from "./assets/PortableIdentity";
import { SharedNetwork } from "./assets/SharedNetwork";
import { TransactionJourney } from "./assets/TransactionJourney";
import { WalletSafety } from "./assets/WalletSafety";
import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Curriculum prototype only: this lab teaches the mental model without a
// contract-writing exercise. Later developer labs can pick up Solidity,
// deployment, and security once the learner understands the system they use.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "ethereum-101-v3",
  title: "Ethereum 101 V3",
  overview:
    "A beginner-friendly tour of Ethereum as a public programmable network: why it exists, what people build, and what happens when you use it.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "shared-computer",
      title: "What is Ethereum?",
      cards: [
        {
          type: "concept",
          id: "ethereum-in-one-sentence",
          label: "CONCEPT",
          title: "A computer no one owns",
          interactive: SharedNetwork,
          body: "**Ethereum is a public network that runs programs and keeps a shared record of what happened.** Thousands of independently operated computers, called **nodes**, check the same rules and keep the network in sync.\n\nThat is why people sometimes call Ethereum a **world computer**. It is not one giant machine in one building. It is many computers cooperating so that no single company owns the shared state.\n\nOpen the interactive and try updating the network, taking a node offline, and faking one node's state. Then ask: why choose this shared setup over an ordinary server?",
        },
        {
          type: "concept",
          id: "what-decentralization-changes",
          label: "CONCEPT",
          title: "Why no single owner matters",
          body: "Most online services have one operator with the final say. That can make them fast and convenient, but it also creates one place that can change access, shut the service down, or keep everyone trapped inside its database.\n\nEthereum spreads control and verification across many independent participants. No single participant can rewrite valid history or change the protocol alone. Changes still happen, but through public proposals, software releases, and coordination across the ecosystem — **not one vote for every Ethereum user**.\n\nThe tradeoff is real: duplicating work makes Ethereum more expensive and slower than an ordinary server. To see when that can be worth it, start with something familiar: an app where you build an identity and relationships.",
        },
      ],
    },
    {
      id: "open-applications",
      title: "Why use an open network?",
      cards: [
        {
          type: "concept",
          id: "when-the-app-owns-the-relationship",
          label: "CONCEPT",
          title: "When the app owns the relationship",
          body: "Imagine spending years building a profile, an audience, and a reputation on one platform. If the company closes your account or changes direction, you may lose the identity and relationships you built there. Moving to another app often means starting again.\n\nThe problem is not that every company is bad. It is that the company owns the database and your account only works inside its product. An **open protocol** can separate the account and social relationships from any one interface. What if another app could recognize both?",
        },
        {
          type: "concept",
          id: "switch-app-keep-account",
          label: "CONCEPT",
          title: "Switch apps, keep your account",
          interactive: PortableIdentity,
          body: "Ethereum lets applications share public identities, ownership, and rules instead of rebuilding those things inside separate company databases. That can make an account **portable**: another compatible app can recognize the same address and read the same public state.\n\nThis does not mean every post, picture, or piece of personal data should be stored on Ethereum. Many applications keep large or private data elsewhere and use Ethereum only for the parts that benefit from shared ownership or verification.\n\nTry following Mina in Commons, then switch to Signal Garden. A shared account is only the start: enforcing shared rules requires programs.",
        },
      ],
    },
    {
      id: "programs-on-ethereum",
      title: "What runs on Ethereum?",
      cards: [
        {
          type: "concept",
          id: "smart-contracts",
          label: "CONCEPT",
          title: "Smart contracts: programs with public rules",
          illustrations: [VendingMachine],
          interactive: ContractRules,
          body: "A **smart contract** is a program deployed to Ethereum. It has an address, can store shared state, and runs its rules when a transaction calls it.\n\nA vending machine is a useful first model: provide the expected input, and the machine follows its published rules without a person approving each customer. The interactive applies that idea to a support rule for Mina's Open Garden project.\n\nSome applications are designed so their rules can be upgraded. The important question is **who can authorize a change and whether users can see the rules**. Once a network can run one public rule, it can support much more.",
        },
        {
          type: "concept",
          id: "more-than-money",
          label: "CONCEPT",
          title: "More than money",
          body: "Smart contracts make Ethereum programmable, so payments are only one category. People use Ethereum-based systems for:\n\n- **Money and assets:** payments, stablecoins, exchanges, and lending.\n- **Identity and social apps:** portable profiles, memberships, and reputation.\n- **Games and digital objects:** items that can move beyond one game's database.\n- **Coordination:** shared treasuries, public goods, tickets, and community decisions.\n\nNot every application needs Ethereum. Its advantage appears when different people or applications need to share state and rules without giving one operator complete control. To use those applications, you need a way to pay for network work and authorize your actions.",
        },
      ],
    },
    {
      id: "accounts-and-wallets",
      title: "How do you use Ethereum?",
      cards: [
        {
          type: "concept",
          id: "eth-two-jobs",
          label: "CONCEPT",
          title: "ETH: value and fees",
          body: "**Ether**, or **ETH**, is Ethereum's native asset. People can hold it and send it directly between accounts, much like other digital money.\n\nETH is also used to pay transaction fees. Ethereum has limited computation and block space, so changing shared state has a cost. Charging for that work helps allocate the network's capacity and makes spam expensive.\n\nReading public information normally does not create a transaction or require gas. Writing a change does. Paying for an action is one part; proving that the action is yours is the next.",
        },
        {
          type: "concept",
          id: "account-address-wallet-key",
          label: "CONCEPT",
          title: "Your account is not your wallet",
          body: "A user-controlled Ethereum **account** is controlled by cryptographic keys. You can generate one without asking a company or government for permission or providing identification. Its public **address** is the identifier other people and applications can use. Activity associated with that address is public by default.\n\nA **wallet** is the interface that helps you manage accounts, view what an application is requesting, and sign messages or transactions. Your ETH and other assets remain recorded on Ethereum; they are not files sitting inside the wallet app.\n\nThe private key or recovery phrase grants control. Anyone who gets it can act as you, and there is usually no support desk that can undo the loss. Smart-contract accounts can use rules defined by code instead. Whatever the account type, you must know what is safe to reveal or approve.",
        },
        {
          type: "concept",
          id: "wallet-safety",
          label: "CONCEPT",
          title: "What is safe to share?",
          interactive: WalletSafety,
          body: "Your address is designed to be public. Your private key and recovery phrase are not. A real support agent, application, or community moderator should never need either secret.\n\nA wallet signature can also authorize an action, so secrecy is only half the job: read what the wallet shows before confirming. If the request is unclear, reject it and investigate.\n\nUse the interactive to choose the safe option for Alex. Once a request is understood, pressing Confirm starts a journey across the network.",
        },
      ],
    },
    {
      id: "transactions",
      title: "What happens after Confirm?",
      cards: [
        {
          type: "concept",
          id: "signed-request",
          label: "CONCEPT",
          title: "From signature to confirmation",
          interactive: TransactionJourney,
          body: "A **transaction** is a signed instruction asking Ethereum to change its shared state. It might send ETH, create a smart contract, vote in an application, buy a game item, or update a profile. Here, Alex wants to support Mina's Open Garden project.\n\nThe wallet shows the request and uses Alex's account key to sign it. The transaction is broadcast and waits with other requests in the **pending pool**, often called the **mempool**. A validator can select it for a block, and nodes execute and verify the result.\n\nWalk through success and revert. The path is similar, but its time, cost and final result can differ.",
        },
        {
          type: "concept",
          id: "gas-pending-failure",
          label: "CONCEPT",
          title: "Why transactions wait or fail",
          body: "**Gas** measures the computation and storage a transaction can consume. You pay the resulting fee in ETH. Part of the fee is burned and part rewards the validator that includes the transaction.\n\nA transaction can remain **pending** when demand is high or its offered fee is not competitive. Pending does not mean failed; it means the transaction has not yet been included.\n\nIf an included transaction reverts, its state change is rolled back, but the computation already happened — so gas is still charged. An invalid transaction rejected before inclusion does not consume onchain gas. Successful actions can also be difficult to reverse. Now use account, wallet, transaction, gas and shared state together.",
        },
      ],
    },
    {
      id: "put-it-together",
      title: "Can you put it all together?",
      cards: [
        {
          type: "concept",
          id: "use-open-application",
          label: "CONCEPT",
          title: "One account, two apps",
          interactive: OpenCommunity,
          body: "Return to Alex, Mina and Open Garden. Use the same public account in Commons and Signal Garden. Supporting the project creates a signed transaction, waits pending, and updates shared state after inclusion.\n\nThen switch applications. The interface changes, but both apps recognize Alex's account and read the same confirmed result. That is the central Ethereum idea made visible: **many interfaces and participants coordinating around one verifiable state**.\n\nThis is a simulation, so no real wallet, ETH, or network is involved. After using the whole flow, can you explain why Ethereum is more than an online bank?",
        },
        {
          type: "question",
          id: "explain-ethereum",
          label: "QUESTION",
          title: "Explain Ethereum to a friend",
          question:
            "A friend says, ‘Ethereum is basically an online bank for crypto.’ How would you correct that picture? Explain what Ethereum is, why someone might use an application built on it, and what happens when they confirm an action in their wallet.",
          rubricConcepts: [
            "Ethereum is a public programmable network with shared state, not a bank",
            "smart contracts enable applications whose state or rules do not depend on one company",
            "a wallet signs a transaction that waits pending, is included and executed, and costs gas",
            "key safety, public activity, or difficult-to-reverse actions are important user gotchas",
          ],
          hints: [
            "Start with the one-sentence definition from the opening card. What does the network run and share?",
            "Use one non-financial example, then follow an action from the wallet to confirmation.",
            "Finish with one warning you would give a first-time user.",
          ],
        },
        {
          type: "summary",
          id: "what-you-now-know",
          label: "SUMMARY",
          title: "The whole journey",
          body: "Alex used one account in two apps, followed Mina and supported Open Garden. The interfaces changed, but the account and confirmed state did not. That worked because Ethereum is a public programmable network maintained by independent participants, with **smart contracts** running on its shared state.\n\nAn **address** identifies an account, while a **wallet** helps protect its authorization and sign requests. **ETH** can carry value and pays the fees for changing shared state. A transaction moves from signature to pending, inclusion, execution, and confirmation.\n\nThe superpowers come with gotchas: activity is public by default, signed actions are difficult to reverse, secrets must stay secret, and shared computation costs gas. You now have the mental model needed to learn how to use a wallet safely in the next lab.",
        },
      ],
    },
  ],
});
