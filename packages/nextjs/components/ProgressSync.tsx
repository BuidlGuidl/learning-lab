"use client";

import { useEffect } from "react";
import { useSession } from "~~/lib/auth-client";
import {
  clearSyncKeys,
  listSnapshotKeys,
  loadSnapshot,
  removeSnapshot,
  syncKeyFor,
} from "~~/services/store/lab-persistence";

// Server wins: an existing row keeps its data and the local copy is dropped; otherwise the local
// copy becomes the row. A 400/404 on PUT means the server refused the blob, so it is dropped too.
// Any other failure keeps the key for a retry on the next mount.
const moveSnapshot = async (labId: string): Promise<void> => {
  const snapshot = loadSnapshot(labId);
  if (!snapshot) return removeSnapshot(labId);

  const path = `/api/progress/${encodeURIComponent(labId)}`;
  const existing = await fetch(path);
  if (existing.status !== 200) {
    if (existing.status !== 404) throw new Error(`GET ${path} ${existing.status}`);
    const put = await fetch(path, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    if (!put.ok && put.status !== 400 && put.status !== 404) throw new Error(`PUT ${path} ${put.status}`);
  }
  removeSnapshot(labId);
};

/**
 * Once per sign-in, moves any anonymous localStorage progress to the server. Runs from the provider
 * tree so it fires wherever the OAuth redirect lands. No refresh afterwards: the redirect is a full
 * page load, so an open lab already hydrated from the right source.
 */
export const ProgressSync = () => {
  const userId = useSession().data?.user.id;

  useEffect(() => {
    if (!userId) return clearSyncKeys();
    const syncKey = syncKeyFor(userId);
    if (window.localStorage.getItem(syncKey)) return;

    void Promise.allSettled(listSnapshotKeys().map(moveSnapshot)).then(results => {
      if (results.every(r => r.status === "fulfilled")) window.localStorage.setItem(syncKey, "1");
    });
  }, [userId]);

  return null;
};
