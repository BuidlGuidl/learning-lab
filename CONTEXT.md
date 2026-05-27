# CONTEXT.md

Living state of the learning-lab repo. Anyone (future-me, future-Claude, future-Rinat) opens this file first and is oriented in 90 seconds.

## Resume here (next session)

**v0.01 just shipped.** The minimal render loop works: a typed `Deck` module exports an array of cards, the deck store holds running `sources` and per-card `progress`, three card components (`concept`, `your-turn`, `code`) render via discriminated-union dispatch, the example deck (basics of Ethereum, 3 cards) renders at `/`.

What's intentionally **not** in v0.01 (all deferred as issues — see §scope-NOT-in-v1 of the architecture brief):

- The other 4 card types (`think`, `try-it`, `ship-it`, `recap`) — types exist in the union, components are not implemented. Renderer dispatch throws "not implemented in v0.01" at runtime.
- AI grading. `your-turn` captures input but never grades. Whatever the learner types threads forward into reveal cards verbatim.
- Slot-fill skeleton machinery (`lib/deck/skeleton.ts`), solc-wasm compilation, tevm runtime. Reveal cards do a plain `source.replace(slot, learnerInput)`.
- Persistence. Zustand store has no `persist` middleware — reload resets state. Decision deferred until storage architecture (localStorage vs backend vs SRE profile) is known.
- Visual aesthetic. Indigo Study Deck (bone cards, saffron/teal, Instrument Serif) is its own scoped issue. v0.01 uses daisyUI defaults.
- SE-2 chrome strip (Header, Footer, debug routes, example contracts). Out of scope — `app/page.tsx` is the only file replaced.
- Multi-deck routing (`/decks/[id]`). Example renders at `/`.

**Next session candidates** (open issues):

1. Add the remaining 4 card components (`think`, `try-it`, `ship-it`, `recap`).
2. Indigo Study Deck aesthetic pass via `/frontend-design`.
3. Slot-fill machinery + solc-wasm port from v0.6.
4. Tevm runtime port — enables `try-it` and `ship-it`.
5. AI grader port — enables `your-turn` verdicts and `think` Socratic feedback.
6. Anchor-aware `code` card (port the vox dim+hover effect from v0.6).
7. SE-2 chrome strip + multi-deck routing.
8. Real lesson decks (start with second throwaway, then crowdfunding).

## Glossary

Terms that the code uses with specific meaning. Domain-experts only — implementation details don't live here.

### card

A single screen of the learning experience. Discriminated on `type` — one of seven members of the `Card` union (`concept | code | your-turn | think | try-it | ship-it | recap`). Each card has an `id` (unique within a deck), a `tier1` (typed English label), and type-specific fields. The Sanskrit `tier2` is derived from `tier1` via `tier-map.ts` — never authored.

### deck

The whole curriculum for one challenge, exported as a typed `Deck` object from `decks/<id>/deck.ts`. A deck has an `id`, a `title`, a `skeleton` (the starting sources, keyed by filename), and an ordered `cards` array.

### skeleton

The *starting state* of the codebase the learner is co-authoring. A `Record<string, string>` keyed by filename. Contains `__SLOT__` tokens where `your-turn` cards will write. Authored as part of the deck.

### slot

A typed token in the skeleton (e.g. `__STORAGE__`) that a `your-turn` card targets. The card declares `slot: "__STORAGE__"` + `file: "Counter.sol"`; on completion, the store does `sources[file] = sources[file].replace(slot, learnerInput)`.

### sources

The *running state* of the codebase, held in the deck store as `Record<string, string>`. Initialised from the deck's `skeleton`. Mutated by `your-turn` cards as the learner submits. Read by `code` cards for rendering. Reset by `resetDeck`. Distinct from `progress` — `sources` is the rendered current code, `progress` is the history of what was typed.

### progress

Per-card history of learner inputs. `Record<CardId, { learnerInput: string }>`. Keeps the raw text the learner typed, separate from the mutated `sources`. Forward-compatible with grading: v0.02+ extends each entry with a `verdict`.

### label

The English label on every card, authored by the deck writer. A typed string-literal union: `"THE IDEA" | "THE CODE" | "YOUR TURN" | "THINK" | "TRY IT" | "SHIP IT" | "WHAT YOU BUILT"`. The author gets autocomplete and a compile error on typos. The discriminated union pins each card type to its specific label (e.g. `type: "concept"` requires `label: "THE IDEA"`), so the field is redundant by design — it makes the card self-documenting while the compiler enforces it.

The Sanskrit second tier from v0.6 (`sutra`, `darshan`, etc.) is **not** rendered and **not** typed — dropped in [[learning-lab]] as decoration that didn't earn its keep. See ADR-0003.

### learner-input threading

The v0.01 rule for how the learner's text appears in reveal cards: whatever they typed in a `your-turn` card threads forward verbatim into subsequent `code` cards that reference the same file. No verdict, no canonical-vs-learner branching. When grading lands in v0.02+, this becomes the "wrong-answer rule" — canonical fills in on a `miss` so subsequent cards still compile.

### CardFrame

The component every card renders inside. Owns the tier1 badge + tier2 italic chip header (derived via `tier-map`), the card title, and the daisyUI card container. Card-type-specific components render the *body* only.

## Build log

### v0.01 — typed-deck render loop — 2026-05-27

Shipped:
- Three-tier doc system bootstrapped: `CLAUDE.md`, `CONTEXT.md`, ADR-0001 (stay on SE-2), ADR-0002 (typed TS deck modules).
- `lib/deck/types.ts` — full 7-member `Card` discriminated union, `CardLabel` literal union, `Deck` type. (Originally shipped with `Tier1`/`Tier2` + a derivation map; same session simplified to a single `label` field — see ADR-0003.)
- `services/store/deck-store.ts` — zustand store with `cardIndex`, `sources`, `progress`, plus `next` / `prev` / `goTo` / `completeYourTurn` / `resetDeck`. No `persist` middleware.
- `components/code/highlighter.ts` + `components/code/CodeBlock.tsx` — shiki singleton, github-dark-dimmed theme, solidity language.
- `components/deck/CardFrame.tsx` + `components/deck/Deck.tsx` + `components/deck/CardRenderer.tsx` + `components/deck/cards/{Concept,YourTurn,Code}Card.tsx`. Other 4 card types throw `not implemented in v0.01` at render time.
- `decks/example/deck.ts` — basics of Ethereum, 3 cards, inline skeleton.
- `app/page.tsx` rewired to render the deck.

Verified: yarn check-types clean, headless Chrome screenshots of all three cards in default and post-input states.

Carryover decisions (recorded inline rather than as full ADRs, since v0.01 doesn't port the v0.6 implementations):
- The 7 card types and the `sources`-as-running-state model carry from v0.6. The formal carryover ADR is deferred until the first real port (solc-wasm, skeleton-fill, or tevm runtime) when there's concrete evidence of what stayed vs changed.

Post-shipping simplification (same session, same day): collapsed the two-tier sanskrit naming to a single English `label` per card. `tier-map.ts` deleted, `Tier2` type dropped, `tier1` renamed to `label`. Recorded as ADR-0003.
