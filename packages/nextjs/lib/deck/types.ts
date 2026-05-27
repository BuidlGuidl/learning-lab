export type CardLabel = "THE IDEA" | "THE CODE" | "YOUR TURN" | "THINK" | "TRY IT" | "SHIP IT" | "WHAT YOU BUILT";

type CardBase = {
  id: string;
  title: string;
};

export type ConceptCard = CardBase & {
  type: "concept";
  label: "THE IDEA";
  body: string;
};

export type CodeCard = CardBase & {
  type: "code";
  label: "THE CODE";
  file: string;
  fromAnchor?: string;
  toAnchor?: string;
  note?: string;
};

export type YourTurnCard = CardBase & {
  type: "your-turn";
  label: "YOUR TURN";
  file: string;
  slot: string;
  prompt: string;
  placeholder?: string;
  canonical: string;
};

export type ThinkCard = CardBase & {
  type: "think";
  label: "THINK";
  question: string;
  rubricConcepts: string[];
  hint?: string;
};

export type TryItCard = CardBase & {
  type: "try-it";
  label: "TRY IT";
  scenario: string;
  body: string;
};

export type ShipItCard = CardBase & {
  type: "ship-it";
  label: "SHIP IT";
  body: string;
};

export type RecapCard = CardBase & {
  type: "recap";
  label: "WHAT YOU BUILT";
  body: string;
};

export type Card = ConceptCard | CodeCard | YourTurnCard | ThinkCard | TryItCard | ShipItCard | RecapCard;

export type Deck = {
  id: string;
  title: string;
  skeleton: Record<string, string>;
  cards: Card[];
};
