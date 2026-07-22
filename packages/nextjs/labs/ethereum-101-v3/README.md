# Ethereum 101 v3 curriculum proposal

This folder is a reviewable curriculum prototype for issue #59. It keeps the
high-level, newcomer-friendly scope of the proposed v2 while recovering the
strongest parts of v1: an interaction in the opening card, a concrete thread
through the lesson, frequent learner action, and a final "use it" payoff.

## Audience

A curious internet user with no assumed blockchain, programming, or finance
knowledge.

## Learning outcomes

By the end, the learner should be able to:

1. Describe Ethereum as a public, programmable network with shared state.
2. Explain what decentralization changes without claiming that every user
   votes or that centralized systems are always bad.
3. Give financial and non-financial examples of Ethereum applications.
4. Distinguish ETH, an account, an address, a wallet, and a private key or
   recovery phrase.
5. Narrate a transaction from wallet signature through the pending pool, or
   mempool, inclusion, execution, and confirmation.
6. Recognize the essential gotchas: public activity, difficult-to-reverse
   actions, key security, and gas on included reverted transactions.

## Scope decisions

- No Solidity, deployment, bytecode, mappings, events, or reentrancy. Those
  belong in later developer labs.
- Social portability is one motivating example, not the definition of
  Ethereum. Money, coordination, ownership, and games remain visible.
- Alex, Mina, Commons, Signal Garden, and Open Garden form one recurring story
  from portable identity through the final confirmed transaction.
- The interactions are explanatory simulations. They do not pretend to be a
  live Ethereum network.
- The v1 World Computer and transaction ideas are retained but represented
  with narrower, more accurate beginner models.

## Card map

| Chapter                      | Cards                                                                        | Active moment                    |
| ---------------------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| What is Ethereum?            | A computer no one owns; Why no single owner matters                          | Shared-network simulation        |
| Why use an open network?     | When the app owns the relationship; Switch apps, keep your account           | Portable-identity simulation     |
| What runs on Ethereum?       | Smart contracts: programs with public rules; More than money                 | Open Garden rules simulation     |
| How do you use Ethereum?     | ETH: value and fees; Your account is not your wallet; What is safe to share? | Wallet-safety decision           |
| What happens after Confirm?  | From signature to confirmation; Why transactions wait or fail                | Transaction lifecycle simulation |
| Can you put it all together? | One account, two apps; Explain Ethereum to a friend; The whole journey       | Simulation and active recall     |

## Card design

The lab stays within 14 cards. Each card has one primary job and earns the
transition to the next card instead of introducing concepts simply because
they are associated with Ethereum.

| Card                                        | Objective                                         | Type                  | Learner action                                   | Gotcha                                                          | Transition                                    |
| ------------------------------------------- | ------------------------------------------------- | --------------------- | ------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------- |
| A computer no one owns                      | Build the base mental model                       | Concept + interactive | Change and challenge a shared network state      | Many cooperating computers are not one cloud machine            | Ask why someone would choose this setup       |
| Why no single owner matters                 | Explain when that architecture matters            | Concept               | Compare Ethereum with an ordinary server         | Openness has real speed and cost tradeoffs                      | Move from infrastructure to a familiar app    |
| When the app owns the relationship          | Make platform dependence concrete                 | Concept               | Imagine losing a long-built audience             | The problem is structural, not “every company is bad”           | Introduce portable state                      |
| Switch apps, keep your account              | Show portability rather than merely claim it      | Concept + interactive | Follow Mina in Commons, then switch apps         | Large or private content need not live on Ethereum              | Ask what can enforce shared rules             |
| Smart contracts: programs with public rules | Explain programs that execute shared rules        | Concept + interactive | Test Open Garden's support rule                  | Inspect who can upgrade rules                                   | Broaden from one program to many categories   |
| More than money                             | Prevent the “Ethereum equals banking” frame       | Concept               | Connect social, games, objects, and coordination | Not every application benefits from Ethereum                    | Introduce what a user needs                   |
| ETH: value and fees                         | Distinguish value from network fees               | Concept               | Contrast reading with changing state             | Reading normally costs no gas; writing does                     | Identify who authorizes writes                |
| Your account is not your wallet             | Separate commonly confused terms                  | Concept               | Map identifier, interface, and authority         | Assets are on Ethereum; the wallet is an interface              | Turn the distinction into a safety decision   |
| What is safe to share?                      | Establish the minimum wallet safety habit         | Concept + interactive | Choose the safe option for Alex                  | Signatures authorize actions without exposing the key           | Press Confirm and follow the request          |
| From signature to confirmation              | Narrate the transaction lifecycle                 | Concept + interactive | Walk Open Garden through success and revert      | An included revert still costs gas                              | Explain why time, cost, and result can differ |
| Why transactions wait or fail               | Interpret common wallet states                    | Concept               | Distinguish pending, reverted, and rejected      | Successful actions may also be irreversible                     | Apply the entire model                        |
| One account, two apps                       | Make the system-level payoff tangible             | Concept + interactive | Support Open Garden, wait, then switch apps      | It is a simulation, not a real wallet or network                | Ask the learner to reconstruct the model      |
| Explain Ethereum to a friend                | Test whether the learner can synthesize the model | Question              | Correct the “online bank” misconception          | Hints support recall without giving a script                    | Resolve with a compact recap                  |
| The whole journey                           | Consolidate and point forward                     | Summary               | Revisit Alex's journey                           | Public activity, secrets, reversibility, and gas remain visible | Continue to a wallet-safety lab               |

## Reference basis

The curriculum uses the following ethereum.org material as its factual and
sequencing reference:

- [Learn hub](https://ethereum.org/learn/)
- [Ethereum accounts](https://ethereum.org/developers/docs/accounts/)
- [Transactions](https://ethereum.org/developers/docs/transactions/)
- [Gas and fees](https://ethereum.org/developers/docs/gas/)

## Review status

The copy is intentionally complete enough for a real walkthrough, but it is
still proposal copy. The next review should test the learner journey and card
jobs before sentence-level polish or new visual production.
