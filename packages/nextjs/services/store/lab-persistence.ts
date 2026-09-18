// Saves a lab's learner state to localStorage so a refresh restores answers and verdicts.
import { type LabSnapshot, isLabSnapshot } from "~~/lib/lab/snapshot";

const SNAPSHOT_KEY_PREFIX = "learning-lab:progress:";
const SYNC_KEY_PREFIX = "learning-lab:synced:";
const keyFor = (labId: string) => `${SNAPSHOT_KEY_PREFIX}${labId}`;

export const loadSnapshot = (labId: string): LabSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(labId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    // A blob from an older shape, or a corrupt one, starts fresh rather than reaching hydrate().
    return isLabSnapshot(parsed) ? parsed : null;
  } catch {
    // storage off (private mode), or unparsable json — start fresh rather than throw on mount.
    return null;
  }
};

export const saveSnapshot = (labId: string, snapshot: LabSnapshot): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(labId), JSON.stringify(snapshot));
  } catch {
    // quota / storage off — the in-memory store still works, the refresh just won't restore.
  }
};

export const removeSnapshot = (labId: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(labId));
  } catch {
    // Disabled storage leaves the snapshot in place for a later retry.
  }
};

// Lab ids with a local snapshot, for the sign-in sweep.
export const listSnapshotKeys = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return Object.keys(window.localStorage)
      .filter(key => key.startsWith(SNAPSHOT_KEY_PREFIX))
      .map(key => key.slice(SNAPSHOT_KEY_PREFIX.length));
  } catch {
    return [];
  }
};

// Once-per-sign-in marker for the sweep.
const syncKeyFor = (userId: string) => `${SYNC_KEY_PREFIX}${userId}`;
export const isSynced = (userId: string): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return !!window.localStorage.getItem(syncKeyFor(userId));
  } catch {
    return true; // storage off: nothing to sweep either
  }
};
export const markSynced = (userId: string): void => {
  try {
    window.localStorage.setItem(syncKeyFor(userId), "1");
  } catch {
    // a dropped write only means the sweep re-runs next load
  }
};

// Sign-out clears the sweep markers AND the progress blobs: the next person on this browser
// must not inherit (and silently upload) the previous user's answers.
export const clearLocalProgress = (): void => {
  if (typeof window === "undefined") return;
  try {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith(SYNC_KEY_PREFIX) || key.startsWith(SNAPSHOT_KEY_PREFIX))
      .forEach(key => window.localStorage.removeItem(key));
  } catch {
    // nothing to clear when storage is off
  }
};
