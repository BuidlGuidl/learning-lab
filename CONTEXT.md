# CONTEXT.md

Living state of the learning-lab repo. Anyone (future-me, future-Claude, future-Rinat) opens this file first and is oriented in 90 seconds.

## Resume here (next session)

**v0.01 + multi-deck plumbing shipped.** The minimal render loop works: typed `Deck` modules export ordered cards, the deck store holds running `sources` and per-card `progress`, three card components (`concept`, `your-turn`, `code`) render via discriminated-union dispatch. Two decks live in `decks/` — `basics` (basics of Ethereum) and `functions` (write a pure adder). Home `/` is a picker; each deck renders at `/decks/[id]`. The store restarts on deck switch — durable state will live in our own backend, not the in-memory store (ADR-0004).

What's intentionally **not** here (all deferred as issues):

- The other 4 card types (`think`, `try-it`, `ship-it`, `recap`) — types exist in the union, components are not implemented. Renderer dispatch throws "not implemented in v0.01" at runtime.
- AI grading. `your-turn` captures input but never grades. Whatever the learner types threads forward into reveal cards verbatim.
- Slot-fill skeleton machinery (`lib/deck/skeleton.ts`), solc-wasm compilation, tevm runtime. Reveal cards do a plain `source.replace(slot, learnerInput)`.
- Backend persistence. Store is a buffer; the backend that will hold durable state doesn't exist yet (ADR-0004). Reload + deck-switch both reset state.
- Visual aesthetic. Indigo Study Deck (bone cards, saffron/teal, Instrument Serif) is its own scoped issue. daisyUI defaults for now.
- SE-2 chrome strip (Header, Footer, debug routes, example contracts).
- Anchor-aware `code` card (port the vox dim+hover effect from v0.6).

**Next session candidates** (open issues):

1. Add the remaining 4 card components (`think`, `try-it`, `ship-it`, `recap`).
2. Slot-fill machinery + solc-wasm port from v0.6.
3. AI grader port — enables `your-turn` verdicts and `think` Socratic feedback.
4. Backend persistence integration — `hydrateFromBackend` action on mount per ADR-0004.
5. Tevm runtime port — enables `try-it` and `ship-it`.
6. Indigo Study Deck aesthetic pass via `/frontend-design`.
7. Anchor-aware `code` card (port the vox dim+hover effect from v0.6).
8. SE-2 chrome strip (Header, Footer, debug routes, example contracts).
9. Real lesson decks (crowdfunding port from v0.6, ERC-20 walk-through).

## Glossary

Terms that the code uses with specific meaning. Domain-experts only — implementation details don't live here.

### card

A single screen of the learning experience. Discriminated on `type` — one of seven members of the `Card` union (`concept | code | your-turn | think | try-it | ship-it | recap`). Each card has an `id` (unique within a deck), a `label` (typed English literal pinned per type via the discriminated union), and type-specific fields.

### deck

The whole curriculum for one challenge, exported as a typed `Deck` object from `decks/<id>/deck.ts`. A deck has an `id`, a `title`, a `skeleton` (the starting sources, keyed by filename), and an ordered `cards` array. Decks are listed in `decks/registry.ts` — see *registry*.

### registry

`decks/registry.ts` — the single source of truth for which decks the app knows about. A `Record<deckId, { title, load }>` where `load` is a dynamic-import thunk so each deck ships in its own chunk. Adding a new deck means creating a folder under `decks/<id>/` and adding one entry here. The router and home picker read from the registry; no code outside it mentions specific deck ids.

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

The component every card renders inside. Owns the label badge, the card title, and the daisyUI card container. Card-type-specific components render the *body* only.

### currentDeckId

The store's marker for "which deck is currently in memory." Null on first mount; set by `init` on every deck mount. `init` is idempotent against the same id (re-mounting the same deck preserves state) and resets state when called with a different id (deck switch). Per ADR-0004, this exists so the store can be an ephemeral buffer — durable cross-device state will live in the backend, hydrated on mount via a future `hydrateFromBackend` action.

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

Multi-deck plumbing folded into the same PR (same day):
- Renamed `decks/example/` → `decks/basics/` and tightened the id from `"example-basics"` to `"basics"` now that it's one of two real decks.
- Added `decks/functions/deck.ts` (write a pure adder, 3 cards, mirrors the `basics` shape) as the second deck.
- Added `decks/registry.ts` as the single source of truth for which decks exist.
- Added `app/decks/[id]/page.tsx` (server component, dynamic-import via registry, `notFound()` on unknown ids).
- Rewrote `app/page.tsx` from "hardcoded deck render" to "minimal picker over registry entries."
- Store: added `currentDeckId`; `init` now takes the full deck seed and is idempotent on same id, resets on different id. Restart-on-switch behavior. Recorded as ADR-0004 (store-as-buffer; backend will be the source of truth when it lands).
