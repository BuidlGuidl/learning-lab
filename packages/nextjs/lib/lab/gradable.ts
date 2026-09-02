import type { Card } from "./types";

export const isGradable = (card: Card): boolean => card.type === "code-exercise" || card.type === "question";
