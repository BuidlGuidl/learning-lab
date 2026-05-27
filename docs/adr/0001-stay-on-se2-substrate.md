# ADR-0001 — Stay on the Scaffold-ETH 2 substrate

**Status:** Accepted
**Date:** 2026-05-27

## Context

learning-lab is a fresh repo for an AI-assisted, typed-deck-driven Solidity learning experience. The predecessor (`sre-learning-lab`, v0.1 → v0.6) was built on a `create-eth` scaffold and validated the substrate end-to-end against a real lesson. The rebuild had to choose a substrate before any other architecture decision.

The viable options were:

1. **Scaffold-ETH 2 via `create-eth`** — the predecessor's substrate. Next.js 15 App Router + wagmi + viem + RainbowKit + daisyUI, with Hardhat (or Foundry) for the chain side.
2. **Bare Next.js + wagmi + viem.** Strip everything the substrate ships and assemble only what the pedagogy needs.
3. **Remix-lite or an in-browser-only IDE shell.** Lean entirely on tevm + browser solc and skip the dApp framework.

## Decision

Stay on Scaffold-ETH 2. Scaffold the new repo with `create-eth`, Hardhat flavor.

## Reasoning

- The pedagogy layer is React-native — cards, decks, store, code viewer, grader UI. SE-2 already ships exactly the integration points we need: Next.js App Router for routing, wagmi/viem clients for the eventual `try-it` and `ship-it` cards, daisyUI for the unstyled-but-decent default look during v0.01, RainbowKit for when a wallet is genuinely required.
- The predecessor already proved this works. The seven card types, the slot-fill skeleton system, the tevm-in-the-browser runtime, the shiki code viewer, and the grader API route all sit cleanly on top of SE-2 without fighting the framework. None of the v0.6 ADRs (especially 0005, the in-browser co-authoring runtime) named SE-2 as a source of friction.
- Brand alignment matters for the audiences we're pitching: Ethereum Foundation funding round and the sandgarden AI-education IP narrative. SE-2 is the canonical Ethereum-ecosystem dApp scaffold; building "the SE-2 way to teach Solidity" is a coherent story.
- Bare Next.js + wagmi (option 2) means we'd reassemble the same bundle of dependencies SE-2 ships, minus the conveniences (`useScaffoldReadContract`, `useScaffoldWriteContract`, `@scaffold-ui/components`, the deployed-contracts ABI generation pipeline). Zero upside, real downside.
- Remix-lite (option 3) collapses too early. `try-it` and `ship-it` cards eventually need a wagmi-style client to talk to the in-browser tevm chain *and* (later) a real testnet. A pedagogy-only IDE shell would have to grow back into a dApp framework as features land.

## Consequences

- We inherit SE-2's chrome (Header with wallet connect, debug-contracts page, block explorer page, example `YourContract.sol`) until we intentionally strip it. v0.01 leaves it in place; subsequent issues will cut what's not pedagogically useful.
- We inherit SE-2's conventions: daisyUI semantic classes, `@scaffold-ui/components` for `<Address>`/`<EtherInput>`/etc., SE-2 hooks for contract interaction. Code reviews should enforce these (see `AGENTS.md` — Carlos's standards).
- We inherit SE-2's upgrade story. Major SE-2 versions occasionally shift conventions (paths, hook names); merging upstream changes becomes a recurring task. Acceptable cost.
- Hardhat flavor over Foundry, chosen to match the v0.6 patterns (solc-wasm worker, multi-file compilation via import callback, OpenZeppelin sources vendored). When `ship-it` cards reach real-testnet deployment, Foundry's tighter integration becomes more compelling — we revisit then.

## Related

- v0.6 ADR-0001 — original substrate decision, same conclusion, full alternative analysis including a remix-lite spike.
