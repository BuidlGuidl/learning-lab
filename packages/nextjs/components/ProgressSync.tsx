"use client";

import { useEffect } from "react";
import { useSession } from "~~/lib/auth-client";
import {
  isSynced,
  listSnapshotKeys,
  loadSnapshot,
  markSynced,
  removeSnapshot,
} from "~~/services/store/lab-persistence";

// Server wins: an existing row keeps its data and the local copy is dropped; otherwise the local
// copy becomes the row. A 400 (or a 404 for a lab the server no longer knows, on PUT) means the
// server refused the blob; the key is kept only when the refusal looks transient.
const moveSnapshot = async (labId: string): Promise<void> => {
  const snapshot = loadSnapshot(labId);
  if (!snapshot) return removeSnapshot(labId);

  const path = `/api/progress/${encodeURIComponent(labId)}`;
  const existing = await fetch(path);
  if (existing.status !== 200) {
    if (existing.status !== 404) throw new Error(`GET ${path} ${existing.status}`);
    // Both "no row yet" and "unknown lab" are 404s; only the first may upload. An unknown or
    // unpublished lab keeps its local copy — deleting here would destroy the only copy.
    if ((await existing.text()).startsWith("unknown lab")) return;
    const put = await fetch(path, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    if (put.status === 404) return; // lab vanished between GET and PUT: keep the local copy
    if (!put.ok && put.status !== 400) throw new Error(`PUT ${path} ${put.status}`);
  }
  removeSnapshot(labId);
};

/**
 * Once per sign-in, moves any anonymous localStorage progress to the server. Runs from the provider
 * tree so it fires wherever the OAuth redirect lands. No refresh afterwards: the redirect is a full
 * page load, so an open lab already hydrated from the right source.
 */
export const ProgressSync = () => {
  const { data: session, isPending } = useSession();
  const userId = session?.user.id;

  useEffect(() => {
    // Wait for the session to resolve: data is null while pending too, and treating that as
    // signed-out would re-run the sweep on every load. Anonymous visitors are left alone here;
    // local progress is cleared on the sign-out action (HeaderAuth), not on the signed-out state.
    if (isPending || !userId) return;
    if (isSynced(userId)) return;

    void Promise.allSettled(listSnapshotKeys().map(moveSnapshot)).then(results => {
      if (results.every(r => r.status === "fulfilled")) markSynced(userId);
    });
  }, [isPending, userId]);

  return null;
};
