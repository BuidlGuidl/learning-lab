"use client";

// The vending-machine mental model for the "Smart contracts" card, made
// literal: you send value (coin in), the contract checks its rules and runs
// automatically, the item drops out, and the whole exchange is written to an
// on-chain record — with nobody behind the counter deciding whether to serve
// you. A static illustration, rendered inline in the card body below the prose.
import { makeIllustration } from "./Illustration";

export const VendingMachine = makeIllustration({
  src: "/smart-contract-vending-machine-ch1-4.png",
  width: 1200,
  height: 675,
  alt: "A vending machine as a smart contract: you send value (coin in), the contract checks its rules and runs automatically, the item is delivered, and the whole exchange is written to an on-chain record — with nobody behind the counter deciding whether to serve you.",
});
