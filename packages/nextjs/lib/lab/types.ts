// Label is type in caps, pinned by the union so it can't drift from
// the dispatch. TODO: WE can probably drive from type in future
import type { ComponentType } from "react";
import type { DeployFn, LabTests, World } from "./harness";
import type { Region, Segment } from "./regions";

export type CardLabel = "CONCEPT" | "CODE" | "CODE EXERCISE" | "QUESTION" | "EXPERIMENT" | "SUMMARY";

type CardBase = {
  id: string;
  title: string;
};

// A read-only card may pair its prose with a visual asset — an interactive,
// an animation, a video — shown in the side rail in place of the code panel
// (see SidePanel). Full react, co-located with the lab like an experiment's
// surface; the host (AssetPanel) supplies the rail chrome, the component just
// fills the body. Omit it and the rail falls back to the code panel.
type WithAsset = {
  asset?: ComponentType;
};

// The mental-model knowledge nugget.
// read-only, no interaction.
export type ConceptCard = CardBase &
  WithAsset & {
    type: "concept";
    label: "CONCEPT";
    body: string;
  };

// Code reveal. Renders a file from the lab's segments with the learner's
// region fills threaded in (unfilled regions show a placeholder). Read-only.
//
// Anchor slicing: fromAnchor and toAnchor trim the rendered file to an
// excerpt. fromAnchor — the first line whose text case-insensitively
// includes the substring starts the excerpt (inclusive). toAnchor — the
// first line after that which includes its substring ends it (exclusive).
// Blank edges are trimmed, softLines are re-offset, and a non-matching
// anchor falls back to the whole file (never throws).
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
  // Free, offline help, revealed one rung at a time (general → specific) before
  // the learner spends an AI call. The AI coach is the escalation past the last rung.
  // TODO(hint-matrix): per-assertion hints keyed to the failing test, once usage warrants.
  hints?: string[];
};

// Open-form prose prompt. Learner writes their own answer; no canonical.
// TODO: Future AI grading scores the response against rubricConcepts.
export type QuestionCard = CardBase &
  WithAsset & {
    type: "question";
    label: "QUESTION";
    question: string;
    rubricConcepts: string[];
    hint?: string;
  };

// Hands-on exploration, the whole deploy beat included. The world only
// exists after the learner presses Deploy — the shell requires every region
// from cards before this one to have a fill, assembles the learner's ACTUAL
// text (canonical backfills only future regions), and runs every check
// earned so far against the assembly before the surface opens: grading
// isolates each region against canonical neighbours, so this run is the one
// place the learner's regions are tested TOGETHER. Compile errors and red
// checks are shown with suspects named, never papered over; the surface
// mounts on green (or on the labelled reference world, one explicit click
// away). Never graded, never gates Next. The surface is a per-lab react
// component receiving the booted World — full react, no widget language;
// mid-lab placement is fine when the component scopes what it shows. Omit it
// for a pure deploy beat: the console is the whole story.
export type ExperimentCard = CardBase & {
  type: "experiment";
  label: "EXPERIMENT";
  scenario: string;
  component?: ComponentType<{ world: World }>;
  // mount the activity console under the card — the deploy receipt plus every
  // read/write the surface makes. Omit for no console; "open" starts it
  // expanded (a deploy card, where the log is the point); "closed" folds it
  // by default (a surface card, where the experience leads).
  console?: "open" | "closed";
};

// End-of-chapter prose. Ties the chapter's cards together (what was
// built, what the learner should now hold). Read-only.
export type SummaryCard = CardBase &
  WithAsset & {
    type: "summary";
    label: "SUMMARY";
    body: string;
  };

export type Card = ConceptCard | CodeCard | CodeExerciseCard | QuestionCard | ExperimentCard | SummaryCard;

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
