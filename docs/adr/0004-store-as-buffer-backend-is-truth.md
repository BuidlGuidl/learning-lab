# ADR-0004 — Deck store is an ephemeral buffer; durable state lives in our own backend

**Status:** Accepted
**Date:** 2026-05-27

## Context

v0.01's grilling deferred the persistence question because the three options (`localStorage`, our own backend DB, a managed third-party like Vercel KV / Supabase) had real cost-of-changing-mind asymmetries. Now that multi-deck routing is landing in the same PR, the store shape needs to be decided — and the persistence destination drives the shape.

For a learning-lab product, learner state needs to follow the user across devices (start on phone, continue on laptop) and across tabs (open deck B without losing deck A's place if they come back to it later, on whatever device). That requirement points away from `localStorage` and toward a server-side store the user is authenticated against.

## Decision

The zustand store is treated as an **ephemeral working buffer** for the current tab and session. Durable per-user-per-deck progress will eventually live in our own backend DB. The store does NOT use `persist` middleware; localStorage is not part of the long-term plan.

Two consequences fall out of this for v0.01's multi-deck plumbing:

1. **Restart-on-switch.** Switching between decks deliberately wipes the in-memory store. The backend, when it lands, is the source of truth — switching is "navigate away from this buffer", not "lose this work."
2. **Single deck in memory at a time.** No `Record<deckId, DeckState>` namespacing inside the store. Just one deck's state, plus a `currentDeckId` field so `init` knows whether to reset.

When the backend lands, mount-time hydration is purely additive: a new `hydrateFromBackend(state)` action fetches `(userId, deckId)` from the API on route mount, calls `setState` to seed the store, and the learner picks up where they left off — on any device. No refactor to existing code.

## Reasoning

- **Cross-device continuation is non-negotiable for a learning product.** localStorage doesn't survive a device switch. That alone rules out localStorage as the durable answer.
- **The store is "now," the backend is "history."** Treating zustand as a buffer keeps that boundary clean. Components don't need to care where their state ultimately comes from — they read from the store, the store gets seeded somehow (init, or hydration later), the seeding mechanism is the only thing that changes.
- **`persist` middleware would be the wrong tool.** It assumes localStorage is the source of truth. Adopting it now means tearing it out later when the backend lands. Not adopting it means one fewer migration.
- **Restart-on-switch is cheap in-memory.** The cost is "you might re-render card 1 of deck A if you come back without backend hydration available." For pure v0.01 plumbing (no backend yet), that's the only friction, and it's tolerable. Once the backend lands, hydration removes it entirely.
- **Per-deck namespacing in the store is premature.** The alternative (`Record<deckId, DeckState>`) buys "switching preserves progress in-memory" — but in-memory progress only matters if there's no backend, and the answer to "no backend" is "build the backend," not "complicate the store." The namespacing would also force every consuming component to switch from `useDeckStore(s => s.X)` to a deck-id-aware selector wrapper. Zero benefit, real refactor cost.

## Consequences

- `services/store/deck-store.ts` gains a `currentDeckId: string | null` field. `init(deck)` is idempotent when called with the same id, resets when called with a different one.
- Card components read from the store with no deck-id wrapper — `useDeckStore(s => s.progress[card.id]?.learnerInput)` keeps working unchanged.
- No `persist` middleware now or later.
- When the backend lands: add a hydration action and call it from `app/decks/[id]/page.tsx` (server component fetches the saved state, passes it to the client component which seeds the store). No changes to the store's existing actions or to any component.
- Switching decks during v0.01 demos loses in-memory progress. Acceptable for the v0.01 cut; resolved by backend integration in a later iteration.

## Related

- ADR-0002 (typed deck modules) — the multi-deck routing this enables consumes the registry pattern introduced alongside this ADR.
- v0.01 grilling section 5 (persistence) — this ADR resolves the deferred decision recorded there.
