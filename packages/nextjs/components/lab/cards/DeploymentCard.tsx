"use client";

// The shared deployment shell. Same boot pipeline as the experiment —
// assemble passed fills → compile → bootWorld — but the world only exists
// after the learner presses Deploy: the click IS the card. The per-lab
// component keeps the surface deliberately narrow (mid-lab worlds carry
// canonical-backfilled future regions, and what the component shows is the
// only place they could leak).
import { useEffect, useRef, useState } from "react";
import { CardFrame } from "../CardFrame";
import { ArrowPathIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { type WorldBoot, bootLearnerWorld } from "~~/lib/lab/learner-world";
import type { DeploymentCard as DeploymentCardType } from "~~/lib/lab/types";

type Props = {
  card: DeploymentCardType;
};

export const DeploymentCard = ({ card }: Props) => {
  const [boot, setBoot] = useState<WorldBoot | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  // keys the author component across redeploys so its state restarts with the world
  const [epoch, setEpoch] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const deploy = async () => {
    setDeploying(true);
    setBootError(null);
    setBoot(null);
    try {
      const b = await bootLearnerWorld();
      if (!mounted.current) return;
      setBoot(b);
      setEpoch(e => e + 1);
    } catch (e) {
      if (mounted.current) setBootError((e as Error).message);
    } finally {
      if (mounted.current) setDeploying(false);
    }
  };

  const Surface = card.component;

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.scenario}</p>

      {bootError && (
        <div className="alert alert-error text-sm mb-3">
          <span className="font-mono whitespace-pre-wrap break-all">{bootError}</span>
        </div>
      )}

      {!boot ? (
        <button className="btn btn-primary gap-2" onClick={deploy} disabled={deploying}>
          {deploying ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Deploying…
            </>
          ) : (
            <>
              <RocketLaunchIcon className="w-5 h-5" />
              {bootError ? "Try again" : "Deploy"}
            </>
          )}
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2 min-h-8">
            {boot.usedCanonicalFallback ? (
              <span className="text-xs text-base-content/50">running the reference solution</span>
            ) : (
              <span />
            )}
            <button
              className="btn btn-ghost btn-sm gap-1.5 text-base-content/60"
              onClick={deploy}
              disabled={deploying}
              title="Wipe the chain and deploy again"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Redeploy
            </button>
          </div>
          <Surface key={epoch} world={boot.world} />
        </>
      )}
    </CardFrame>
  );
};
