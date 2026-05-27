import type { Deck } from "~~/lib/deck/types";

type DeckEntry = {
  title: string;
  load: () => Promise<{ deck: Deck }>;
};

// Single source of truth for which decks exist. Adding a deck = add one
// folder under decks/ + one entry here. Routing, the home picker, and
// the store stay agnostic to specific deck ids.
export const registry: Record<string, DeckEntry> = {
  basics: {
    title: "Basics of Ethereum",
    load: () => import("./basics/deck"),
  },
  functions: {
    title: "Functions on a contract",
    load: () => import("./functions/deck"),
  },
};
