"use client";

// The experiment shell owns the whole deploy beat. The world only exists
// after the learner presses Deploy — and the button stays off until every
// region this card checks has a fill, so a sidebar peek gets pointed back
// to the writing, never a green run of reference code presented as theirs.
// The click compiles the learner's actual fills, runs every check earned so
// far against the whole assembly, and only a green door mounts the author's
// surface; on green the checklist collapses to one summary row so the
// surface gets the stage. Compile errors and red checks render with the
// suspect regions named — "run the reference solution" is the explicit,
// labelled escape. Redeploy reboots the world and swaps the component's
// react key, so author-side state clears for free.
import { useEffect, useMemo, useRef, useState } from "react";
import { CardFrame } from "../CardFrame";
import { TestRunPanel } from "./TestRunPanel";
import { ArrowPathIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { short } from "~~/lib/lab/format";
import {
  type ExperimentBoot,
  bootExperimentWorld,
  bootReferenceWorld,
  regionsBeforeCard,
} from "~~/lib/lab/learner-world";
import type { RunProgress } from "~~/lib/lab/run";
import type { ExperimentCard as ExperimentCardType, Lab } from "~~/lib/lab/types";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: ExperimentCardType;
  lab: Lab;
};

const Suspects = ({ regions, verb }: { regions: string[]; verb: string }) => (
  <p className="text-sm text-base-content/70 mt-1 mb-0">
    Your code for{" "}
    {regions.map((region, i) => (
      <span key={region}>
        {i > 0 && ", "}
        <code className="font-mono">{region}</code>
      </span>
    ))}{" "}
    {verb} — go back to {regions.length === 1 ? "that card" : "those cards"}, fix it, and deploy again.
  </p>
);

export const ExperimentCard = ({ card, lab }: Props) => {
  const regionIds = useMemo(() => regionsBeforeCard(lab, card.id), [lab, card.id]);
  const testNames = useMemo(
    () => regionIds.flatMap(region => (lab.tests[region] ?? []).map(t => t.name)),
    [lab, regionIds],
  );

  // Deploying needs the learner's contract to exist first: every region this
  // card checks must have a fill (a learner submit, or a skip's canonical).
  // Canonical never stands in for an untouched region here; future regions
  // still backfill — they have to, for the assembly to compile.
  const labProgress = useLabStore(s => s.progress);
  const missing = useMemo(() => {
    const fills = fillsOf(labProgress);
    return regionIds.filter(region => !(region in fills));
  }, [labProgress, regionIds]);

  // null = not deployed yet; ok:false = the learner's assembly didn't compile
  const [boot, setBoot] = useState<ExperimentBoot | null>(null);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  // unexpected failure (deploy script, worker death) — distinct from compile errors
  const [crash, setCrash] = useState<string | null>(null);
  // keys the author component across deploys so its state restarts with the world
  const [epoch, setEpoch] = useState(0);
  const busy = progress !== null;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const launch = async (booter: () => Promise<ExperimentBoot>) => {
    setCrash(null);
    setBoot(null);
    setProgress({ step: "compiling" });
    try {
      const result = await booter();
      if (!mounted.current) return;
      setBoot(result);
      if (result.ok) setEpoch(e => e + 1);
    } catch (e) {
      if (mounted.current) setCrash((e as Error).message);
    } finally {
      if (mounted.current) setProgress(null);
    }
  };

  const deploy = () =>
    launch(() =>
      bootExperimentWorld(regionIds, (done, total) => {
        if (mounted.current) setProgress({ step: "testing", total, results: done });
      }),
    );

  const Surface = card.component;
  const redChecks = boot?.ok && !boot.reference && !boot.passed ? boot : null;
  const open = boot?.ok && (boot.reference || boot.passed) ? boot : null;
  const failedRegions = redChecks ? [...new Set(redChecks.checks.filter(c => !c.passed).map(c => c.region))] : [];

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed mt-0 mb-4 whitespace-pre-wrap">{card.scenario}</p>

      {crash && (
        <div className="alert alert-error text-sm mb-3">
          <span className="font-mono whitespace-pre-wrap break-all">{crash}</span>
        </div>
      )}

      {missing.length > 0 ? (
        // fill-gate: nothing of the learner's to ship yet
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-base-300 bg-base-200/60 px-4 py-3">
            <p className="text-sm text-base-content/80 m-0">
              Nothing to deploy yet — you haven&apos;t written{" "}
              {missing.map((region, i) => (
                <span key={region}>
                  {i > 0 && ", "}
                  <code className="font-mono">{region}</code>
                </span>
              ))}
              . Go back to {missing.length === 1 ? "that card" : "those cards"} first; this button ships <em>your</em>{" "}
              code.
            </p>
          </div>
          <button className="btn btn-primary gap-2 self-start" disabled>
            <RocketLaunchIcon className="w-5 h-5" />
            Deploy
          </button>
        </div>
      ) : boot === null ? (
        // idle (and the live run, narrated by the panel below)
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
      ) : !boot.ok ? (
        // the learner's assembly didn't compile
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
            <p className="text-sm font-medium text-error m-0">Your contract didn&apos;t compile.</p>
            {boot.suspects.length > 0 && <Suspects regions={boot.suspects} verb="isn't passing yet" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm gap-1.5" onClick={deploy} disabled={busy}>
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
      ) : redChecks ? (
        // it deployed, but the checks caught it — fix first, surface stays shut
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
            <p className="text-sm font-medium text-error m-0">It deployed, but some checks aren&apos;t passing.</p>
            <Suspects regions={failedRegions} verb="isn't behaving right" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm gap-1.5" onClick={deploy} disabled={busy}>
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
      ) : open ? (
        // green door (or the labelled reference world): the surface gets the stage
        <div className="flex flex-col gap-3">
          {open.reference ? (
            <p className="text-xs text-base-content/50 m-0">running the reference solution, not your code</p>
          ) : open.checks.length === 0 ? (
            // nothing earned to verify yet — open the surface without claiming a check that never ran
            <></>
          ) : (
            <details className="rounded-box border border-base-300 bg-base-200/60">
              <summary className="cursor-pointer select-none px-4 py-2.5 font-mono text-xs text-base-content/70">
                <span className="text-success">✓</span> {open.checks.length}/{open.checks.length}{" "}
                {open.checks.length === 1 ? "check" : "checks"}
                {Object.entries(open.world.contracts).map(([name, handle]) => (
                  <span key={name} className="text-base-content/50">
                    {" "}
                    · {name} live at{" "}
                    <span title={handle.address} className="text-base-content/70">
                      {short(handle.address)}
                    </span>
                    {handle.deployment?.gasUsed !== undefined && (
                      <> · {handle.deployment.gasUsed.toLocaleString()} gas</>
                    )}
                  </span>
                ))}
              </summary>
              <div className="border-t border-base-300 px-4 pb-3">
                <TestRunPanel testNames={testNames} progress={null} verdict="pass" results={open.checks} />
              </div>
            </details>
          )}

          <Surface key={epoch} world={open.world} />

          <button
            className="btn btn-ghost btn-sm gap-1.5 self-start text-base-content/60"
            onClick={deploy}
            disabled={busy}
            title="Wipe the chain and deploy your code again"
          >
            {busy ? <span className="loading loading-spinner loading-xs" /> : <ArrowPathIcon className="w-4 h-4" />}
            Redeploy
          </button>
        </div>
      ) : null}

      {/* the checks live at the bottom while they're the story — upfront todos,
          live phases, compile errors, red rows. on green they collapse into the
          summary row above instead. */}
      {!open && (
        <TestRunPanel
          testNames={testNames}
          progress={progress}
          verdict={boot === null ? undefined : boot.ok ? (boot.passed ? "pass" : "fail") : "fail"}
          results={boot?.ok ? boot.checks : undefined}
          compilerErrors={boot && !boot.ok ? boot.errors : undefined}
        />
      )}
    </CardFrame>
  );
};
