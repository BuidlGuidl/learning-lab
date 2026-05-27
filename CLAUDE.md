# CLAUDE.md

This is the **learning-lab** repo — an AI-assisted, typed-deck-driven learning experience on top of Scaffold-ETH 2. See `CONTEXT.md` for the live state, glossary, and build log. See `docs/adr/` for architectural decisions.

@AGENTS.md provides the SE-2 substrate reviewer guidance (Carlos's standards). The rules below layer on top of that.

## Hard rules

- **Before writing UI code** → invoke `/frontend-design` skill. No exceptions for learner-facing surfaces. (v0.01 ships daisyUI defaults *as a conscious override* — see ADR-0002 + build log. Polish is its own scoped issue.)
- **Before writing learner-facing copy** → read `/Users/shivbhonde/Documents/shiv/3. Resources/sandgarden-blog-writing-style.md`. Senior-dev-to-junior voice, no hype, no em dashes, no bold-label paragraphs, no punchline endings.
- **Visual verification is mandatory.** Type-check + HTTP 200 ≠ verified. Drive headless Chrome and screenshot before reporting any UI work done.
- **Doc system runs three tiers from day one.** `CONTEXT.md` for state + glossary, `docs/adr/` for decisions, `CLAUDE.md` for orientation. Rewrite the `## Resume here` block at the end of every meaningful session.
- **Use `/grill-with-docs`** before crystallising any substantive design decision. Glossary stays in sync with the code's vocabulary.

## ADR pointers

- `docs/adr/0001-stay-on-se2-substrate.md` — read before considering a substrate change. The Next.js + wagmi + viem + daisyUI stack is the substrate; pedagogy primitives live on top.
- `docs/adr/0002-typed-deck-modules.md` — read before changing how decks are authored. Decks are typed TS modules at `decks/<id>/deck.ts`.
- `docs/adr/0003-single-label-drop-sanskrit.md` — read before adding any secondary chip / metadata above a card title. Cards carry one English `label` (`"THE IDEA"`, `"THE CODE"`, etc.) constrained by the discriminated union; the two-tier sanskrit naming from v0.6 was dropped.

## Code philosophy

Carlos (`AGENTS.md`) is the bar: clear over clever, every abstraction earns its place, `type` over `interface`, discriminated unions for state, no lazy `any`, daisyUI semantic classes (not raw Tailwind colours), components do one thing, server components by default. Default to **no comments** — only add one when the WHY is non-obvious.

## Where things live

- `packages/nextjs/lib/deck/` — types, tier-map, future skeleton/loader
- `packages/nextjs/services/store/` — zustand deck store
- `packages/nextjs/components/deck/` — Deck shell, CardRenderer, CardFrame, per-type card components
- `packages/nextjs/components/code/` — shiki highlighter + CodeBlock
- `packages/nextjs/decks/<id>/deck.ts` — the typed deck modules
