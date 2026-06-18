"use client";

import { useEffect, useState } from "react";
import { Lab } from "~~/components/lab/Lab";
import { registry } from "~~/labs/registry";
import type { Lab as LabType } from "~~/lib/lab/types";

// Labs carry functions (deploy, per-region tests) that can't cross the RSC
// serialization boundary, and everything about a lab renders client-side
// anyway (store, solc worker, tevm). So the dynamic import happens here, on
// the client — the registry's per-lab chunking is preserved.
export const LabLoader = ({ id }: { id: string }) => {
  const [lab, setLab] = useState<LabType | null>(null);

  useEffect(() => {
    let cancelled = false;
    registry[id]?.load().then(({ lab }) => {
      if (!cancelled) setLab(lab);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!lab) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="loading loading-dots loading-md text-primary" />
      </div>
    );
  }
  return <Lab lab={lab} />;
};
