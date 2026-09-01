import type { LearningTranscript } from "../grader/transcript";

// The serializable half of a learner's lab state: what localStorage and the lab_progress row hold.
// The lab's code shape is reloaded from its module, and a live in-browser chain can't be serialized.
export type LabSnapshot = {
  chapterIndex: number;
  cardIndex: number;
  maxReached: { chapterIndex: number; cardIndex: number };
  progress: Record<string, { learnerInput: string; region: string }>;
  transcript: LearningTranscript;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIndex = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;

// Plain boolean, not a type predicate: a predicate would narrow the whole snapshot to a position.
const hasPosition = (value: Record<string, unknown>) => isIndex(value.chapterIndex) && isIndex(value.cardIndex);

const OUTCOMES = new Set(["pass", "fail", "skipped"]);
const isGradingEvent = (value: unknown) =>
  isPlainObject(value) && typeof value.cardId === "string" && OUTCOMES.has(value.outcome as string);

// Runtime shape check for a snapshot that came from storage or the network; the type alone can't
// guard a request body or a stale localStorage blob.
export const isLabSnapshot = (value: unknown): value is LabSnapshot => {
  if (!isPlainObject(value) || !hasPosition(value)) return false;
  if (!isPlainObject(value.maxReached) || !hasPosition(value.maxReached)) return false;
  if (!isPlainObject(value.progress) || !isPlainObject(value.transcript)) return false;
  const validEntries = Object.values(value.progress).every(
    entry => isPlainObject(entry) && typeof entry.learnerInput === "string" && typeof entry.region === "string",
  );
  if (!validEntries) return false;
  const { labId, events } = value.transcript;
  return typeof labId === "string" && Array.isArray(events) && events.every(isGradingEvent);
};
