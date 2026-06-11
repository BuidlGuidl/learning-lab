// Label is type in caps, pinned by the union so it can't drift from
// the dispatch. TODO: WE can probably drive from type in future
import type { ComponentType } from "react";
import type { DeployFn, LabTests, World } from "./harness";
import type { Region, Segment } from "./regions";

export type CardLabel = "CONCEPT" | "CODE" | "CODE EXERCISE" | "QUESTION" | "EXPERIMENT" | "DEPLOYMENT" | "SUMMARY";

type CardBase = {
  id: string;
  title: string;
};

// The mental-model knowledge nugget.
// read-only, no interaction.
export type ConceptCard = CardBase & {
  type: "concept";
  label: "CONCEPT";
  body: string;
};

// Code reveal. Renders a file from the lab's segments with the learner's
// region fills threaded in (unfilled regions show a placeholder). Read-only.
export type CodeCard = CardBase & {
  type: "code";
  label: "CODE";
  file: string;
  fromAnchor?: string;
  toAnchor?: string;
  note?: string;
};

// Closed-form code prompt. Learner writes a small unit (expression,
// statement, fn body) that fills a region of the lab's contracts. The
// region's file and canonical live on Lab.regions, derived from the marked
// .sol source — the card only points at the region.
export type CodeExerciseCard = CardBase & {
  type: "code-exercise";
  label: "CODE EXERCISE";
  region: string;
  prompt: string;
  placeholder?: string;
};

// Open-form prose prompt. Learner writes their own answer; no canonical.
// TODO: Future AI grading scores the response against rubricConcepts.
export type QuestionCard = CardBase & {
  type: "question";
  label: "QUESTION";
  question: string;
  rubricConcepts: string[];
  hint?: string;
};

// Hands-on exploration. Learner pokes at their own assembled contract in a
// fresh tevm world to build intuition. No canonical, no required action to
// advance. The interactive surface is a per-lab react component (ADR-0018)
// that receives the booted World — the shared shell owns assemble → compile
// → boot and the card chrome.
export type ExperimentCard = CardBase & {
  type: "experiment";
  label: "EXPERIMENT";
  scenario: string;
  component: ComponentType<{ world: World }>;
};

// Deploy beat. Learner ships the contract to a real evm and confirms it
// runs there. The moment-of-truth before the chapter closes.
export type DeploymentCard = CardBase & {
  type: "deployment";
  label: "DEPLOYMENT";
  body: string;
};

// End-of-chapter prose. Ties the chapter's cards together (what was
// built, what the learner should now hold). Read-only.
export type SummaryCard = CardBase & {
  type: "summary";
  label: "SUMMARY";
  body: string;
};

export type Card =
  | ConceptCard
  | CodeCard
  | CodeExerciseCard
  | QuestionCard
  | ExperimentCard
  | DeploymentCard
  | SummaryCard;

export type Chapter = {
  id: string;
  title: string;
  cards: Card[];
};

export type Lab = {
  id: string;
  title: string;
  // derived from the marked contracts by defineLab — segments per file, and
  // every region (file, scope, canonical) keyed by id
  files: Record<string, Segment[]>;
  regions: Record<string, Region>;
  // how this lab's world boots, and the behavioural tests per region — the
  // same functions run in validate-labs (node) and at grade time (browser)
  deploy: DeployFn;
  tests: LabTests;
  chapters: Chapter[];
};
