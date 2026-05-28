// Label is type in caps, pinned by the union so it can't drift from
// the dispatch. TODO: WE can probably drive from type in future

export type CardLabel = "IDEA" | "CODE" | "CODE EXERCISE" | "QUESTION" | "EXPERIMENT" | "DEPLOYMENT" | "SUMMARY";

type CardBase = {
  id: string;
  title: string;
};

// The mental-model knowledge nugget.
// read-only, no interaction.
export type IdeaCard = CardBase & {
  type: "idea";
  label: "IDEA";
  body: string;
};

// Code reveal. Renders a file from sources (skeleton with any
// code-exercise slot-fills threaded in). Read-only.
export type CodeCard = CardBase & {
  type: "code";
  label: "CODE";
  file: string;
  fromAnchor?: string;
  toAnchor?: string;
  note?: string;
};

// Closed-form code prompt. Learner writes a small unit (expression,
// statement, fn body) that substitutes into __SLOT__ in the file.
// TODO: Canonical answer pinned by the author; future AI grading checks against it.
export type CodeExerciseCard = CardBase & {
  type: "code-exercise";
  label: "CODE EXERCISE";
  file: string;
  slot: string;
  prompt: string;
  placeholder?: string;
  canonical: string;
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

// TODO: Will be implemented in next iteration
// Hands-on exploration. Learner pokes at the contract (calls a fn with
// different inputs, watches state change) to build intuition. No
// canonical, no required action to advance. Body can be probably react component
export type ExperimentCard = CardBase & {
  type: "experiment";
  label: "EXPERIMENT";
  scenario: string;
  body: string;
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
  | IdeaCard
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
  skeleton: Record<string, string>;
  chapters: Chapter[];
};
