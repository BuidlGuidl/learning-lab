// Saves a lab's learner state to localStorage so a refresh restores answers and verdicts.
// Only serializable state is kept: the lab's code shape is reloaded from its module, and an
// experiment's live in-browser chain can't be serialized, so a refresh re-deploys it.
import type { Position } from "./lab-store";
import type { LearningTranscript } from "~~/lib/grader/transcript";

export type LabSnapshot = {
  chapterIndex: number;
  cardIndex: number;
  maxReached: Position;
  progress: Record<string, { learnerInput: string; region: string }>;
  transcript: LearningTranscript;
};

const keyFor = (labId: string) => `learning-lab:progress:${labId}`;

export const loadSnapshot = (labId: string): LabSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(labId));
    return raw ? (JSON.parse(raw) as LabSnapshot) : null;
  } catch {
    // storage off (private mode), or a corrupt blob — start fresh rather than throw on mount.
    return null;
  }
};

export const saveSnapshot = (labId: string, snapshot: LabSnapshot): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(labId), JSON.stringify(snapshot));
  } catch {
    // quota or disabled storage — a dropped write just means this session won't restore.
  }
};
