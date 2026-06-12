"use client";

// The shared experiment shell. The world only exists after the learner
// presses Deploy — the click is part of the card. The shell assembles the
// learner's actual fills; a compile failure renders THEIR errors with the
// suspect cards named, never a silent canonical fallback (running the
// reference solution is an explicit button). Redeploy reboots the world and
// swaps the component's react key, so author-side state clears for free.
import { useEffect, useRef, useState } from "react";
import { CardFrame } from "../CardFrame";
import { ArrowPathIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { type LearnerBoot, bootLearnerWorld, bootReferenceWorld } from "~~/lib/lab/learner-world";
import type { ExperimentCard as ExperimentCardType } from "~~/lib/lab/types";

type Props = {
  card: ExperimentCardType;
};

export const ExperimentCard = ({ card }: Props) => {
  // null = not deployed yet; ok:false = the learner's assembly didn't compile
  const [boot, setBoot] = useState<LearnerBoot | null>(null);
  const [busy, setBusy] = useState(false);
  // unexpected failure (deploy script, worker death) — distinct from compile errors
  const [crash, setCrash] = useState<string | null>(null);
  // keys the author component across deploys so its state restarts with the world
  const [epoch, setEpoch] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const launch = async (booter: () => Promise<LearnerBoot>) => {
    setBusy(true);
    setCrash(null);
    try {
      const result = await booter();
      if (!mounted.current) return;
      setBoot(result);
      if (result.ok) setEpoch(e => e + 1);
    } catch (e) {
      if (mounted.current) setCrash((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const Surface = card.component;

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.scenario}</p>

      {crash && (
        <div className="alert alert-error text-sm mb-3">
          <span className="font-mono whitespace-pre-wrap break-all">{crash}</span>
        </div>
      )}

      {boot === null ? (
        <button className="btn btn-primary gap-2" onClick={() => launch(bootLearnerWorld)} disabled={busy}>
          {busy ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Deploying…
            </>
          ) : (
            <>
              <RocketLaunchIcon className="w-5 h-5" />
              {crash ? "Try again" : "Deploy"}
            </>
          )}
        </button>
      ) : !boot.ok ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
            <p className="text-sm font-medium text-error m-0">Your contract didn&apos;t compile.</p>
            {boot.suspects.length > 0 && (
              <p className="text-sm text-base-content/70 mt-1 mb-0">
                Your code for{" "}
                {boot.suspects.map((region, i) => (
                  <span key={region}>
                    {i > 0 && ", "}
                    <code className="font-mono">{region}</code>
                  </span>
                ))}{" "}
                isn&apos;t passing yet — go back to {boot.suspects.length === 1 ? "that card" : "those cards"}, fix it,
                and deploy again.
              </p>
            )}
            <pre className="font-mono text-xs whitespace-pre-wrap break-all text-base-content/70 mt-2 mb-0 max-h-48 overflow-y-auto">
              {boot.errors.join("\n")}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm gap-1.5" onClick={() => launch(bootLearnerWorld)} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-xs" />}
              Deploy again
            </button>
            <button
              className="btn btn-sm btn-ghost text-base-content/60"
              onClick={() => launch(bootReferenceWorld)}
              disabled={busy}
              title="Deploy the lab's reference solution instead of your code"
            >
              Run the reference solution
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2 min-h-8">
            {boot.reference ? (
              <span className="text-xs text-base-content/50">running the reference solution, not your code</span>
            ) : (
              <span />
            )}
            <button
              className="btn btn-ghost btn-sm gap-1.5 text-base-content/60"
              onClick={() => launch(bootLearnerWorld)}
              disabled={busy}
              title="Wipe the chain and deploy your code again"
            >
              {busy ? <span className="loading loading-spinner loading-xs" /> : <ArrowPathIcon className="w-4 h-4" />}
              Redeploy
            </button>
          </div>
          <Surface key={epoch} world={boot.world} />
        </>
      )}
    </CardFrame>
  );
};
