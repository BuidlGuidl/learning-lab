// Textbook frame. Lab → Chapter → Card. Card types are nouns naming
// what each card *is*, not what the learner *does*. When extending
// the union, stay in the same lane (idea, summary, etc.), not do-it
// patterns (try-it, your-turn). Label always equals the type
// discriminant in caps; the union pins the pair so the rendered
// string and the dispatch can't drift apart.

export type CardLabel = "IDEA" | "CODE" | "CODE EXERCISE" | "QUESTION" | "EXPERIMENT" | "DEPLOYMENT" | "SUMMARY";

type CardBase = {
  id: string;
  title: string;
};

export type IdeaCard = CardBase & {
  type: "idea";
  label: "IDEA";
  body: string;
};

export type CodeCard = CardBase & {
  type: "code";
  label: "CODE";
  file: string;
  fromAnchor?: string;
  toAnchor?: string;
  note?: string;
};

export type CodeExerciseCard = CardBase & {
  type: "code-exercise";
  label: "CODE EXERCISE";
  file: string;
  slot: string;
  prompt: string;
  placeholder?: string;
  canonical: string;
};

export type QuestionCard = CardBase & {
  type: "question";
  label: "QUESTION";
  question: string;
  rubricConcepts: string[];
  hint?: string;
};

export type ExperimentCard = CardBase & {
  type: "experiment";
  label: "EXPERIMENT";
  scenario: string;
  body: string;
};

export type DeploymentCard = CardBase & {
  type: "deployment";
  label: "DEPLOYMENT";
  body: string;
};

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
