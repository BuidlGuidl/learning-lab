"use client";

// The generic deployment shell — pure data, no per-lab component. The deploy
// click compiles the learner's actual fills, ships them to a fresh chain,
// and runs every check earned so far against the whole contract (grading
// isolates regions; this is the one run that tests them together). The
// checks are visible up front as todos, same as the exercise cards. Red
// names the suspect regions but never gates Next; there is no reference
// button here — watching canonical tests pass canonical code proves nothing.
import { useEffect, useMemo, useRef, useState } from "react";
import { CardFrame } from "../CardFrame";
import { TestRunPanel } from "./TestRunPanel";
import { ArrowPathIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { type DeploymentBoot, bootDeploymentWorld, regionsBeforeCard } from "~~/lib/lab/learner-world";
import type { RunProgress } from "~~/lib/lab/run";
import type { DeploymentCard as DeploymentCardType, Lab } from "~~/lib/lab/types";

type Props = {
  card: DeploymentCardType;
  lab: Lab;
};

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const DeploymentCard = ({ card, lab }: Props) => {
  const regionIds = useMemo(() => regionsBeforeCard(lab, card.id), [lab, card.id]);
  const testNames = useMemo(
    () => regionIds.flatMap(region => (lab.tests[region] ?? []).map(t => t.name)),
    [lab, regionIds],
  );

  const [run, setRun] = useState<DeploymentBoot | null>(null);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  // unexpected failure (deploy script, worker death) — distinct from compile errors
  const [crash, setCrash] = useState<string | null>(null);
  const busy = progress !== null;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const deploy = async () => {
    setCrash(null);
    setRun(null);
    setProgress({ step: "compiling" });
    try {
      const result = await bootDeploymentWorld(regionIds, (done, total) => {
        if (mounted.current) setProgress({ step: "testing", total, results: done });
      });
      if (mounted.current) setRun(result);
    } catch (e) {
      if (mounted.current) setCrash((e as Error).message);
    } finally {
      if (mounted.current) setProgress(null);
    }
  };

  const failedRegions = run?.ok ? [...new Set(run.checks.filter(c => !c.passed).map(c => c.region))] : [];

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mb-4 whitespace-pre-wrap">{card.scenario}</p>

      {crash && (
        <div className="alert alert-error text-sm mb-3">
          <span className="font-mono whitespace-pre-wrap break-all">{crash}</span>
        </div>
      )}

      {run === null ? (
        <button className="btn btn-primary gap-2" onClick={deploy} disabled={busy}>
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
      ) : !run.ok ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
            <p className="text-sm font-medium text-error m-0">Your contract didn&apos;t compile.</p>
            {run.suspects.length > 0 && (
              <p className="text-sm text-base-content/70 mt-1 mb-0">
                Your code for{" "}
                {run.suspects.map((region, i) => (
                  <span key={region}>
                    {i > 0 && ", "}
                    <code className="font-mono">{region}</code>
                  </span>
                ))}{" "}
                isn&apos;t passing yet — go back to {run.suspects.length === 1 ? "that card" : "those cards"}, fix it,
                and deploy again.
              </p>
            )}
          </div>
          <button className="btn btn-sm gap-1.5 self-start" onClick={deploy} disabled={busy}>
            {busy && <span className="loading loading-spinner loading-xs" />}
            Deploy again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-box bg-base-200 px-5 py-4 flex flex-col gap-2">
            {Object.entries(run.world.contracts).map(([name, handle]) => (
              <div key={name} className="flex items-center justify-between gap-4">
                <span className="font-mono text-sm">{name}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-base-content/60">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${run.passed ? "bg-success animate-ping" : "bg-warning"}`}
                    />
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${run.passed ? "bg-success" : "bg-warning"}`}
                    />
                  </span>
                  <span title={handle.address}>live on this tab&apos;s chain at {short(handle.address)}</span>
                </span>
              </div>
            ))}
          </div>

          {run.passed ? (
            <p className="text-sm text-base-content/60 m-0">All checks passing. Your contract is live.</p>
          ) : (
            <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
              <p className="text-sm font-medium text-error m-0">It deployed, but some checks aren&apos;t passing.</p>
              <p className="text-sm text-base-content/70 mt-1 mb-0">
                Your code for{" "}
                {failedRegions.map((region, i) => (
                  <span key={region}>
                    {i > 0 && ", "}
                    <code className="font-mono">{region}</code>
                  </span>
                ))}{" "}
                isn&apos;t behaving right — go back to {failedRegions.length === 1 ? "that card" : "those cards"}, fix
                it, and deploy again.
              </p>
            </div>
          )}

          <button
            className="btn btn-ghost btn-sm gap-1.5 self-start text-base-content/60"
            onClick={deploy}
            disabled={busy}
          >
            {busy ? <span className="loading loading-spinner loading-xs" /> : <ArrowPathIcon className="w-4 h-4" />}
            {run.passed ? "Redeploy" : "Deploy again"}
          </button>
        </div>
      )}

      <TestRunPanel
        testNames={testNames}
        progress={progress}
        verdict={run === null ? undefined : run.ok ? (run.passed ? "pass" : "fail") : "fail"}
        results={run?.ok ? run.checks : undefined}
        compilerErrors={run && !run.ok ? run.errors : undefined}
      />
    </CardFrame>
  );
};
