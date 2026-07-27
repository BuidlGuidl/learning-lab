# Ethereum 101 — Section → Card Outline

Skeleton for the non-technical Ethereum 101 lab (issue #59, PR #63 discussion).
5 sections, 15 cards. Narrative spine: **what is it → what can it do → how do you
hold it → how do you use it → recap.**

**Ground rules for all copy:**

- Every card must teach something the reader didn't know before. Each concept
  gets exactly one home; later mentions are one-line callbacks, never
  re-explanations.
- The "traditional banking is flawed" contrast lives in **one short paragraph of
  card 1.2** and nowhere else.
- Plain language everywhere. When a term of art is unavoidable (gas, smart
  contract, blockchain), define it in one sentence at its home card and move on.
- No card should end by restating its own opening.

---

## Section 1 — What is Ethereum?

*Job: give them the machine and the payoff, in two cards.*

### 1.1 The world computer

- **Type:** concept · WorldComputer interactive + StateNetwork illustration (existing)
- **The one new idea:** Ethereum is one shared computer run by thousands of independent machines.
- **Info to cover:**
  - Most apps run on servers owned by one company; Ethereum runs on thousands of
    independent computers around the world, called **nodes**.
  - Together the nodes act as one shared computer: each keeps its own copy of
    the same record (who owns what, what programs are running).
  - When something changes, every node checks it independently and they all
    agree on one shared history. The duplicated effort is the point — everyone
    verifying means no one has to be trusted.
  - No company owns it: state this **once**, cleanly. The consequences are the
    next card's material.
- **Keep out:** why decentralization matters (1.2), smart contracts (2.2),
  blocks/blockchain (4.3).

### 1.2 Why "no one in charge" matters

- **Type:** concept
- **The one new idea:** the practical payoff of decentralization.
- **Info to cover:**
  - The rules of the system are public — anyone can read them.
  - They apply to everyone equally and can't be changed quietly; changes happen
    in the open.
  - No administrator can freeze your account, block a valid action, or rewrite
    history.
  - **The condensed banking contrast (one short paragraph, the only banks
    mention in the lab):** in the traditional system a small group writes rules
    you can't realistically read, can change them, and decides what you're
    allowed to do — you use it on faith. Optional single neutral clause
    referencing 2008 (or drop it).
- **Keep out:** any multi-card problem/solution buildup; repeated
  "quietly/sneakily/behind the scenes" phrasing (say it once); code-as-rules
  detail (that lands with smart contracts, 2.2).

---

## Section 2 — More than money

*Job: programmability — the thing that separates Ethereum from "crypto."*

### 2.1 Not just a better Bitcoin

- **Type:** concept
- **The one new idea:** Ethereum = decentralized money **plus** programs.
- **Info to cover:**
  - Bitcoin proved money can move without a bank; most readers have heard of it.
  - Ethereum does that too — and it can also run code. That one difference is
    where everything else in this lab comes from.
  - Tee up the next card: those programs have a name.
- **Keep out:** defining smart contracts here (2.2 owns it); Bitcoin mechanics.

### 2.2 Smart contracts

- **Type:** concept · VendingMachine illustration (existing)
- **The one new idea:** what a program-on-Ethereum is. Defined once, here.
- **Info to cover:**
  - A **smart contract** is a program stored on Ethereum, with its own address.
  - Vending-machine mental model: right coin + button → item comes out, no
    person behind the counter deciding whether to serve you.
  - Once deployed, the code is public and runs the same way every time, for
    everyone.
  - This is what "rules written in code" looks like in practice — one sentence
    linking back to 1.2, no re-derivation.
- **Keep out:** Solidity/EVM/deployment details; token standards.

### 2.3 What people build — and the buzzwords

- **Type:** concept · interactive placeholder: tap-through app gallery or mini-quiz
- **The one new idea:** the real app landscape, with the jargon decoded.
- **Info to cover:**
  - Categories in plain words: payments and savings, borrowing/lending/trading
    (**DeFi**), dollar-steady tokens (**stablecoins**), digital objects you truly
    own (**NFTs**), internet-native co-ops with shared treasuries (**DAOs**),
    games, identity/memberships.
  - Frame the buzzwords as translation: "words you'll hear — here's what they
    actually mean." One line each, no depth.
  - Honest close: not every app needs Ethereum. It shines when strangers need
    shared rules and records without handing one company control.
- **Keep out:** price/investment framing; deep dives on any single category
  (future labs).

---

## Section 3 — Your money, your keys

*Job: the personal toolkit — Ether, account, key, wallet — one connected story.*

### 3.1 Ether

- **Type:** concept
- **The one new idea:** ETH is the network's native money.
- **Info to cover:**
  - Ether (ETH) is the currency built into Ethereum: hold it, send it to anyone,
    anywhere, at any hour.
  - It trades against dollars/euros on exchanges (one sentence — "getting ETH"
    is not this lab's job).
  - **One forward-looking sentence:** ETH is also what pays the network for its
    work — details when we get to gas (4.2). Do not explain it here.
- **Keep out:** a second "power source" framing paragraph (old repetition
  offender); tokenomics, supply, price history.

### 3.2 Accounts and addresses

- **Type:** concept
- **The one new idea:** your account lives on the network; the address is its public name.
- **Info to cover:**
  - An account holds your ETH and lets you act on the network. It lives *on the
    network*, not on your phone or laptop.
  - Its **address** is a public identifier, like an account number — it's what
    people use to send you ETH, and it's safe to share.
  - Anyone can create an account in seconds: no paperwork, no ID, no permission.
  - End on the hook: with no sign-up authority, how do you prove an account is
    *yours*?
- **Keep out:** private key content (3.3 owns it); "wallet holds the key not the
  ETH" (3.4 owns it).

### 3.3 The private key

- **Type:** concept · interactive placeholder: Austin's brute-force key game
  (pick digit count, watch short keys get cracked, see full-length keys become
  untouchable)
- **The one new idea:** a secret number is the only proof of ownership.
- **Info to cover:**
  - Every account comes with a **private key**: a secret value created with it.
  - Knowing that secret is the *only* thing that proves control — there is no
    manager, password reset, or ID check behind it.
  - Anyone who learns your private key controls the account and can take
    everything in it. Never share it.
  - Let the game carry "why can't someone just guess it?" — keep the text short.
- **Keep out:** cryptography detail (signatures land in 4.1, lightly); recovery
  phrases (3.5 mentions them in the safety rule).

### 3.4 Wallets

- **Type:** concept
- **The one new idea:** the app that guards your key and acts for you.
- **Info to cover:**
  - A wallet is an app on your device with two jobs: keep your private key
    secret, and let you use the network safely (send ETH, approve actions).
  - Name mismatch: unlike a real wallet it holds your *key*, not your ETH — the
    ETH stays on the network (one line; 3.2 established where accounts live).
  - Lose the key/recovery phrase and there's no support desk to call — which is
    why the next card is about what's safe to reveal.
  - Teaser: the next lab is entirely about wallets.
- **Keep out:** re-deriving "key = control" from 3.3 (one-line callback max);
  wallet brand recommendations; hardware vs. software wallets.

### 3.5 What's safe to share?

- **Type:** interactive · WalletSafety (existing)
- **The one new idea:** the practical sharing rule, drilled.
- **Info to cover (minimal text — the interactive is the card):**
  - Address: public by design. Private key and recovery phrase: never — no real
    app, support agent, or moderator needs them.
  - A wallet signature can authorize an action without revealing your key — so
    read what you're approving; if it's unclear, reject it.
  - Assume 3.3/3.4 are known; zero re-explanation.
- **Keep out:** repeating the private-key definition or the "wallet holds the
  key" line.

---

## Section 4 — Making things happen

*Job: the verbs — transaction, fee, permanent record.*

### 4.1 Transactions

- **Type:** concept · TransactionJourney interactive (existing)
- **The one new idea:** a signed instruction is how anything happens.
- **Info to cover:**
  - A **transaction** asks the network to do something. Simplest: send ETH to an
    address — like a bank transfer, minus the bank.
  - The same mechanism calls smart contracts: vote on a proposal, buy an item in
    a game, join a fundraiser (concrete, non-financial examples on purpose).
  - The flow: your wallet signs it with your private key → broadcasts it → nodes
    check it against the rules → it takes effect.
  - End on the hook: making the network work for you has a price.
- **Keep out:** blocks/blockchain/permanence (4.3 owns it); mempool (deferred
  entirely); gas mechanics (4.2).

### 4.2 Gas

- **Type:** concept
- **The one new idea:** every action pays a small fee, and why.
- **Info to cover:**
  - The fee is called **gas**, paid in ETH — this is 3.1's forward reference
    paying off (one line, then new material).
  - Why it exists: thousands of real machines do real work — hardware,
    electricity, bandwidth — and the fee pays for that effort.
  - Second job: because every action costs something, nobody can flood the
    network with junk for free.
  - Bigger actions cost more; you pay even if your action fails — one more
    reason to read before you sign (callback to 3.5, one line).
  - Small aside: the network's energy use fell ~99% with the 2022 switch to
    proof of stake. Name it in one sentence; staking/validators are a later lab.
- **Keep out:** gas price/limit/units, fee markets, EIP-1559; staking mechanics.

### 4.3 Written in stone

- **Type:** concept
- **The one new idea:** where it all lands — the permanent public record.
- **Info to cover:**
  - Confirmed transactions are bundled into **blocks**, added one after another
    into a single chain — this is the **blockchain**, the shared history every
    node keeps (one-line callback to 1.1).
  - Two consequences a newcomer must internalize: activity is public by default,
    and confirmed actions are effectively irreversible — there's no
    chargeback line.
  - Frame both as features with sharp edges: the same permanence that stops
    history from being rewritten also means *your* mistakes stick.
- **Keep out:** consensus/validators, block times, explorers (later labs).

---

## Section 5 — Putting it together

### 5.1 Explain it to a friend

- **Type:** question
- **Prompt:** a friend says "Ethereum is basically an online bank for crypto" —
  correct the picture.
- **Rubric direction (write fresh, do NOT copy summary lines):** looking for
  (a) a network of independent nodes rather than a company, (b) it runs
  programs, not just payments, (c) the wallet-signs → network-checks →
  permanent-record flow, (d) the small gas fee and what it's for.
- **Hints:** nudge toward 1.1, 2.2, and 4.1 without quoting them.

### 5.2 Summary + what's next

- **Type:** summary
- **Info to cover:**
  - One short recap paragraph tracing the arc (shared computer → programs →
    your keys → transactions and their cost → permanent record).
  - Compact glossary of only the terms actually taught: node, smart contract,
    ETH, address, private key, wallet, transaction, gas, block/blockchain.
  - Safety refrain in one line: public by default, hard to reverse, your key is
    yours alone.
  - Teaser trail: wallets lab next; later labs on transactions in depth
    (mempool), staking/validators, and building your own contracts.
- **Keep out:** re-teaching anything; the banking contrast (it had its paragraph
  in 1.2).

---

## Deliberately deferred (breadth stays, depth waits)

- Mempool · staking/validators/consensus · L2s · how to buy ETH · PoS mechanics
  beyond the one energy sentence · token standards · any single-app deep dive.

## Interactive/illustration inventory

| Card | Asset | Status |
| --- | --- | --- |
| 1.1 | WorldComputer + StateNetwork | existing |
| 2.2 | VendingMachine | existing |
| 2.3 | app gallery / mini-quiz | placeholder |
| 3.3 | private-key brute-force game | placeholder |
| 3.5 | WalletSafety | existing |
| 4.1 | TransactionJourney | existing |

No stretch of more than two consecutive text-only cards.
