# ADR-0002 — Decks are typed TypeScript modules, not JSON or YAML

**Status:** Accepted
**Date:** 2026-05-27

## Context

A *deck* is the whole curriculum for one challenge — an ordered sequence of cards (concept prose, code reveals, your-turn writes, etc.) plus a starting `skeleton` (the source files the learner co-authors). Carlos's rebuild framing is *"the system is the asset, the content is the instance"*: the expert teacher fills out a structured authoring surface, the runtime consumes it and renders. The authoring surface needs a format.

Three reasonable shapes:

1. **JSON.** One file per deck, `decks/<id>/deck.json`. Validate at load time (zod, ajv, etc.).
2. **YAML.** Same as JSON but with friendlier whitespace + multi-line strings.
3. **TypeScript module.** `decks/<id>/deck.ts` exports a typed `Deck` object. The system `import`s the module and renders.

## Decision

Decks are TypeScript modules. Each deck exports a `Deck` object that conforms to the discriminated-union schema in `lib/deck/types.ts`. The deck module is imported (statically for v0.01, dynamically once multi-deck routing exists) and passed to the `<Deck>` component.

## Reasoning

Three axes mattered:

- **Type-safety at the author's keyboard.** The `Card` discriminated union has seven members, each with required and optional fields, each with constrained literal-string values (`tier1` is one of seven exact strings). With TypeScript, a typo in `tier1` (`"THE IEDA"`) or a missing field on a `your-turn` card is a compile error the moment the author saves. With JSON, the same error is a runtime exception when the deck loads, or — worse — a silently-wrong render if validation is incomplete. The cost of catching errors at save-time vs page-load-time scales with how often we iterate on a deck. We iterate constantly.
- **Editor autocomplete.** The TS language server surfaces every literal-string value, every property name, every optional-vs-required distinction as the author types. JSON Schema + editor support gets you partway, but: it requires every author to have a schema-aware editor configured, it doesn't handle discriminated unions as cleanly (the IDE has to know "if `type` is `your-turn` then these fields apply"), and the developer experience is still less responsive than native TS.
- **Imports work.** A deck can `import skeletonSource from "./Counter.sol?raw"` to keep solidity files highlighted in the editor while still embedding them as strings. It can `import { commonRubricConcepts } from "./shared"` to reuse phrasing across cards. It can compose. JSON/YAML offer none of this.

The trade we accept: a non-engineer can't author a deck. They'd need a text editor, an understanding of TypeScript syntax (`export const`, object literals, template strings), and tolerance for compile errors. We judge this acceptable because the deck author is `[[carlos]]` and `[[shiv]]` for the foreseeable future — both engineers. When a non-engineer admin surface is wanted, the option is to build a small web UI that emits a `deck.ts` (or a JSON file that the build step compiles into one). That's a future option, not foreclosed.

The skill-creator/grill-with-docs lens also matters here: a typed schema is the *single source of truth* for what a card is, and the TS compiler enforces it everywhere it's referenced. JSON would need the same schema written twice (once in zod, once in TS types), with drift between them inevitable.

## Consequences

- The `Card` discriminated union in `lib/deck/types.ts` is the contract between deck authors and the renderer. Adding a new card type means: extend the union, add a renderer branch, pick the card's English `label`. That's it.
- v0.01 uses **inline template literals** for the skeleton (`skeleton: { "Counter.sol": \`pragma solidity ...\` }`). v0.0X migrates to sibling `.sol` files imported via `?raw` once decks span multiple non-trivial files. The `Deck` type doesn't change either way.
- Loading is `import("...")` for v0.01 (one deck, statically imported). When multi-deck routing lands, a loader (`lib/deck/loader.ts`) does dynamic imports keyed by deck id.
- Validation is the TS compiler. No zod, no ajv, no JSON-parse error path. If a deck author writes an invalid deck, `yarn check-types` rejects it.
- Each card carries one English `label` constrained by its type in the discriminated union. The two-tier sanskrit naming inherited from v0.6 (and the Devanagari third tier dropped in the architecture brief) is gone — see ADR-0003.

## Related

- v0.6 ADR-0003 — the original flashcard-deck shape (predecessor decks were also TS-authored; this ADR formalises the choice for the new repo).
- The architecture brief at `/Users/shivbhonde/Documents/shiv/2. Areas/sandgarden/updates/2026-05-26-learning-lab-fresh-repo-architecture-brief.md` — §philosophy 2 and §architecture — the-deck-module section.
