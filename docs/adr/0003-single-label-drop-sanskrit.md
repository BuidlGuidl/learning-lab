# ADR-0003 — One English label per card; drop the two-tier sanskrit naming

**Status:** Accepted
**Date:** 2026-05-27
**Supersedes (partially):** the two-tier scheme inherited from v0.6 ([[sre-learning-lab]] ADR-0003, with the Devanagari glyph already dropped in the architecture brief)

## Context

The predecessor repo ([[sre-learning-lab]]) shipped a two-tier card header: an English label (`tier1`, e.g. `"THE IDEA"`) above a Sanskrit transliteration (`tier2`, e.g. `sutra`) above an optional Devanagari watermark glyph. The editorial logic was that the Sanskrit carried the vedic guru-shishya framing the product wanted, and the English was the accessible surface ([[sre-learning-lab-naming-philosophy]] is the essay).

The architecture brief for learning-lab ([[2026-05-26-learning-lab-fresh-repo-architecture-brief]] §philosophy 6) had already collapsed the system from three tiers to two — Devanagari dropped as decoration that didn't earn its keep, English + Sanskrit retained. v0.01 shipped with that two-tier shape: admin types `tier1` as a literal-string union, renderer looks up `tier2` via `lib/deck/tier-map.ts`, `<CardFrame>` renders both.

Reviewing v0.01 in the same session, the call was to collapse further: keep only the English label.

## Decision

One label per card, English only. The field is named `label`. Its values are the seven literals from v0.6 — `"THE IDEA"`, `"THE CODE"`, `"YOUR TURN"`, `"THINK"`, `"TRY IT"`, `"SHIP IT"`, `"WHAT YOU BUILT"` — typed as a `CardLabel` union and pinned to each card-type member of the discriminated `Card` union (so `type: "concept"` requires `label: "THE IDEA"`). `tier-map.ts` is deleted. The Sanskrit transliterations are not rendered, not stored, not typed.

## Reasoning

- The Sanskrit half wasn't earning attention. With daisyUI defaults and no aesthetic pass (per the v0.01 grilling), the italic `sutra` next to the saffron badge `THE IDEA` looked unmoored from any visual system. The cultural texture the Sanskrit was supposed to carry needs the bone-card / Instrument-Serif typography to land, and that aesthetic is now its own deferred issue. Until the aesthetic ships, the Sanskrit was decoration without a frame.
- The editorial spine the Sanskrit was meant to carry is still in play — it lives in the architecture brief, the naming-philosophy essay, the build logs, and the project's positioning. It doesn't have to live on every card to live in the product. If a later iteration finds a way to surface the Sanskrit that genuinely reads (a per-deck epigraph, a closing meditation card, a documentation page), it can come back.
- Removing the derivation eliminates a layer of plumbing whose only output was paired-with-tier1 visual content that the renderer was already coupling. `tier-map.ts` was seven lines, but it was also an indirection between "what the author writes" and "what the user sees." For a v0.01 product whose architecture conversation is still active, fewer indirections means easier-to-reason-about changes.
- The Carlos code-review lens (`AGENTS.md`): "every abstraction must earn its place." A 7-entry map that exists to render one extra string per card doesn't, at v0.01 scale.

## Consequences

- The field is renamed `tier1` → `label`. The type is renamed `Tier1` → `CardLabel`. `Tier2` is deleted.
- `lib/deck/tier-map.ts` is deleted.
- `<CardFrame>` renders only the badge — no italic span, no second chip. The `flex items-baseline gap-3` wrapper is gone.
- Deck modules need no changes beyond `tier1` → `label` (a mechanical rename). The literal-string values are unchanged.
- If the Sanskrit ever returns, it returns as a *separate decision* with its own ADR. This ADR does not foreclose that return; it just removes the always-on rendering today.
- The name `label` is generic. If a better name surfaces (`eyebrow`, `chip`, `phase`), it's a one-pass rename across types + components + decks. Cheap.

## Related

- ADR-0002 — typed TS deck modules (updated inline to reference this ADR).
- [[sre-learning-lab-naming-philosophy]] — the original essay on two-tier sanskrit naming. Now historical; the framing still informs the product's editorial voice even though the visual two-tier is gone.
- The architecture brief at `/Users/shivbhonde/Documents/shiv/2. Areas/sandgarden/updates/2026-05-26-learning-lab-fresh-repo-architecture-brief.md` — §philosophy 6 (drop Devanagari, keep two tiers). This ADR pares further from there.
