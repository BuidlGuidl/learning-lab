"use client";

// The experiment shell owns the deploy beat. The world only exists after the
// learner presses Deploy — and the button stays off until every region this
// card checks has a fill, so a sidebar peek gets pointed back to the writing,
// never a green run of reference code presented as theirs. The click compiles
// the learner's actual fills and runs every check earned so far against the
// whole assembly — silently: those checks are the gate that keeps a broken
// contract off the surface, not a readout. A green door mounts the author's
// surface; a compile error or a red check shows the actual errors with the
// suspect cards named, "run the reference solution" the labelled escape.
// Redeploy reboots the world and swaps the surface's react key, so author-side
// state clears for free. An opt-in <Console> (card.console) logs the deploy and
// every read/write the surface makes against the live contract.
//
// TODO(state-sharing): a deploy card and a following experiment card should
// share one world — deploy once, experiment on the same live contract. Today
// every experiment card boots its own world on its own Deploy click.
import { useEffect, useMemo, useRef, useState } from "react";
import { CardFrame } from "../CardFrame";
import { Console, type ConsoleEntry } from "./Console";
import { ArrowPathIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import type { ContractHandle, World } from "~~/lib/lab/harness";
import {
  type ExperimentBoot,
  bootExperimentWorld,
  bootReferenceWorld,
  regionsBeforeCard,
} from "~~/lib/lab/learner-world";
import type { RunProgress } from "~~/lib/lab/run";
import type { ExperimentCard as ExperimentCardType, Lab } from "~~/lib/lab/types";
import { COMPILER_UNAVAILABLE, isCompilerUnavailable } from "~~/lib/solc/solc";
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
  // the console's activity log — deploy receipt aside, the reads/writes the
  // surface makes. Cleared on every deploy so a fresh world starts a fresh log.
  const [log, setLog] = useState<ConsoleEntry[]>([]);
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
    setLog([]);
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

  // The world the surface gets, with read/write wrapped to log every call into
  // the console. Recreated per deploy (open changes identity), so each world
  // starts a clean log; the harness stays pure for the ci validator, which has
  // no console — the instrumentation lives here, on the UI side.
  const loggedWorld = useMemo<World | null>(() => {
    if (!open) return null;
    const bootedWorld = open.world;
    const contractNameOf = (contract: ContractHandle) =>
      Object.keys(bootedWorld.contracts).find(name => bootedWorld.contracts[name].address === contract.address) ??
      "contract";
    const appendEntry = (entry: ConsoleEntry) => setLog(previousEntries => [...previousEntries, entry]);
    return {
      ...bootedWorld,
      read: async (contract, functionName, args) => {
        try {
          const result = await bootedWorld.read(contract, functionName, args);
          appendEntry({ kind: "read", contract: contractNameOf(contract), fn: functionName, args: args ?? [], result });
          return result;
        } catch (error) {
          appendEntry({
            kind: "read",
            contract: contractNameOf(contract),
            fn: functionName,
            args: args ?? [],
            error: (error as Error).message,
          });
          throw error;
        }
      },
      write: async (contract, functionName, options) => {
        const result = await bootedWorld.write(contract, functionName, options);
        const firstError = result.errors?.[0];
        appendEntry({
          kind: "write",
          contract: contractNameOf(contract),
          fn: functionName,
          args: options?.args ?? [],
          from: options?.from,
          value: options?.value,
          ok: !firstError,
          error: firstError ? (firstError.message ?? firstError.name) : undefined,
        });
        return result;
      },
    };
  }, [open]);

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
        isCompilerUnavailable(boot.errors) ? (
          // not the learner's code — the compiler itself couldn't load. No
          // suspects, no reference (it needs the compiler too); just retry.
          <div className="flex flex-col gap-3">
            <div className="rounded-box border border-warning/40 bg-warning/5 px-4 py-3">
              <p className="text-sm font-medium text-warning m-0">{COMPILER_UNAVAILABLE}</p>
            </div>
            <button className="btn btn-sm gap-1.5 self-start" onClick={deploy} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-xs" />}
              Deploy again
            </button>
          </div>
        ) : (
          // the learner's assembly didn't compile
          <div className="flex flex-col gap-3">
            <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
              <p className="text-sm font-medium text-error m-0">Your contract didn&apos;t compile.</p>
              {boot.suspects.length > 0 && <Suspects regions={boot.suspects} verb="isn't passing yet" />}
              <pre className="mt-2 mb-0 overflow-x-auto rounded-md border border-base-300 bg-base-300/40 p-3 font-mono text-xs leading-relaxed text-error/80 whitespace-pre-wrap break-all">
                {boot.errors.join("\n\n")}
              </pre>
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
        )
      ) : redChecks ? (
        // it deployed, but the checks caught it — fix first, surface stays shut
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-error/40 bg-error/5 px-4 py-3">
            <p className="text-sm font-medium text-error m-0">It deployed, but some checks aren&apos;t passing.</p>
            <Suspects regions={failedRegions} verb="isn't behaving right" />
            <ul className="mt-2 mb-0 list-none space-y-1 pl-0">
              {redChecks.checks
                .filter(check => !check.passed)
                .map((failedCheck, index) => (
                  <li key={index} className="font-mono text-xs text-error/80 whitespace-pre-wrap break-all">
                    ✗ {failedCheck.name}
                    {failedCheck.error ? ` — ${failedCheck.error}` : ""}
                  </li>
                ))}
            </ul>
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
        // green door (or the labelled reference world): the surface gets the
        // stage. the checks that gated it here stay silent — they ran to keep
        // a broken contract off the surface, not to be read.
        <div className="flex flex-col gap-3">
          {open.reference && (
            <p className="text-xs text-base-content/50 m-0">running the reference solution, not your code</p>
          )}

          {Surface && loggedWorld && <Surface key={epoch} world={loggedWorld} />}

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

      {/* opt-in activity log: the deploy receipt, then every read/write the
          surface above makes against the live contract. Sits under the UI;
          a deploy card opens it, a surface card folds it. */}
      {card.console && (
        <Console
          progress={progress}
          boot={boot}
          crash={crash}
          interactions={log}
          defaultOpen={card.console === "open"}
        />
      )}
    </CardFrame>
  );
};
