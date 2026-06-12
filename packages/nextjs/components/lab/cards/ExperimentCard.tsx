"use client";

// The shared experiment shell (ADR-0018). Owns the world lifecycle —
// assemble → compile → boot — and the card chrome; the lab's component only
// ever sees a ready World. Reset reboots the world and swaps the component's
// react key, so author-side state clears without any experiment writing
// reset logic. Fresh world per mount, nothing persists across navigation.
import { useEffect, useState } from "react";
import { CardFrame } from "../CardFrame";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { type WorldBoot, bootLearnerWorld } from "~~/lib/lab/learner-world";
import type { ExperimentCard as ExperimentCardType } from "~~/lib/lab/types";

type Props = {
  card: ExperimentCardType;
};

export const ExperimentCard = ({ card }: Props) => {
  const [boot, setBoot] = useState<WorldBoot | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  // epoch bumps on reset: re-runs the boot effect and keys the author
  // component, so world and component state restart together
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setBoot(null);
    setBootError(null);
    bootLearnerWorld()
      .then(b => !cancelled && setBoot(b))
      .catch(e => !cancelled && setBootError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [epoch]);

  const Playground = card.component;

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.scenario}</p>

      <div className="flex items-center justify-between mb-2 min-h-8">
        {boot?.usedCanonicalFallback ? (
          <span className="text-xs text-base-content/50">running the reference solution</span>
        ) : (
          <span />
        )}
        <button
          className="btn btn-ghost btn-sm gap-1.5 text-base-content/60"
          onClick={() => setEpoch(e => e + 1)}
          disabled={!boot}
          title="Wipe the chain and redeploy"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset
        </button>
      </div>

      {bootError ? (
        <div className="alert alert-error text-sm">
          <span className="font-mono whitespace-pre-wrap break-all">{bootError}</span>
          <button className="btn btn-sm" onClick={() => setEpoch(e => e + 1)}>
            Try again
          </button>
        </div>
      ) : !boot ? (
        <div className="flex flex-col gap-3" aria-label="deploying your contract">
          <div className="skeleton h-20 w-full" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-36" />
            <div className="skeleton h-8 w-36" />
            <div className="skeleton h-8 w-36" />
          </div>
          <div className="skeleton h-24 w-full" />
          <p className="text-xs text-base-content/50">compiling and deploying your contract to a fresh chain…</p>
        </div>
      ) : (
        <Playground key={epoch} world={boot.world} />
      )}
    </CardFrame>
  );
};
