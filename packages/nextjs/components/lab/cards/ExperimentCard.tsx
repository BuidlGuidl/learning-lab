"use client";

// Experiment card: the learner deploys the contract they've been writing, then
// gets the author's interactive surface once the deploy passes its checks, plus
// an optional activity console. World state lives in the lab store keyed by
// world id, so a deployed world persists as the learner moves between cards and
// the card only renders it. A card deploys its own world, or reuses one an
// earlier card deployed (sharesWorld / reusesWorld).
import { useMemo } from "react";
import { CardFrame } from "../CardFrame";
import { Markdown } from "../Markdown";
import { Console, type ConsoleEntry } from "./Console";
import { ArrowPathIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import type { ContractHandle, World } from "~~/lib/lab/harness";
import {
  type ExperimentBoot,
  bootExperimentWorld,
  bootReferenceWorld,
  regionsBeforeCard,
} from "~~/lib/lab/learner-world";
import type { ExperimentCard as ExperimentCardType, Lab } from "~~/lib/lab/types";
import { COMPILER_UNAVAILABLE, isCompilerUnavailable } from "~~/lib/solc/solc";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: ExperimentCardType;
  lab: Lab;
};

// Wraps a world so the surface's reads and writes are appended to the console
// log. Kept out of the harness so the validator runs console-free.
function makeLoggedWorld(bootedWorld: World, appendEntry: (entry: ConsoleEntry) => void): World {
  const contractNameOf = (contract: ContractHandle) =>
    Object.keys(bootedWorld.contracts).find(name => bootedWorld.contracts[name].address === contract.address) ??
    "contract";
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
}

// Finds the card that deploys a given world, so a card reusing it can link back.
function findSharer(
  lab: Lab,
  worldId: string,
): { card: ExperimentCardType; chapterIndex: number; cardIndex: number } | null {
  for (let chapterIndex = 0; chapterIndex < lab.chapters.length; chapterIndex++) {
    const cards = lab.chapters[chapterIndex].cards;
    for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
      const candidate = cards[cardIndex];
      if (candidate.type === "experiment" && candidate.id === worldId && candidate.sharesWorld) {
        return { card: candidate, chapterIndex, cardIndex };
      }
    }
  }
  return null;
}

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

export const ExperimentCard = ({ card, lab }: Props) =>
  card.reusesWorld ? <ReuseWorldCard card={card} lab={lab} /> : <DeployWorldCard card={card} lab={lab} />;

// Deploys a world (keyed by the card's id) and mounts its surface on green.
// sharesWorld marks that world as reusable by a later card.
const DeployWorldCard = ({ card, lab }: Props) => {
  const worldId = card.id;
  const regionIds = useMemo(() => regionsBeforeCard(lab, card.id), [lab, card.id]);

  const world = useLabStore(s => s.worlds[worldId]);
  const startDeploy = useLabStore(s => s.startDeploy);
  const setDeployProgress = useLabStore(s => s.setDeployProgress);
  const finishDeploy = useLabStore(s => s.finishDeploy);
  const failDeploy = useLabStore(s => s.failDeploy);
  const markRevealed = useLabStore(s => s.markRevealed);
  const appendConsoleEntry = useLabStore(s => s.appendConsoleEntry);

  // Deploying needs the learner's contract to exist first: every region this
  // card checks must have a fill (a learner submit, or a skip's canonical).
  // Canonical never stands in for an untouched region here; future regions
  // still backfill — they have to, for the assembly to compile.
  const labProgress = useLabStore(s => s.progress);
  const missing = useMemo(() => {
    const fills = fillsOf(labProgress);
    return regionIds.filter(region => !(region in fills));
  }, [labProgress, regionIds]);

  const boot = world?.boot ?? null;
  const progress = world?.progress ?? null;
  const crash = world?.crash ?? null;
  const log = world?.log ?? [];
  const epoch = world?.epoch ?? 0;
  const revealed = world?.revealed ?? false;
  const busy = progress !== null;

  // Runs a deploy, writing each phase to the store.
  const launch = async (booter: () => Promise<ExperimentBoot>) => {
    startDeploy(worldId);
    try {
      finishDeploy(worldId, await booter());
    } catch (e) {
      failDeploy(worldId, (e as Error).message);
    }
  };

  const deploy = () =>
    launch(() =>
      bootExperimentWorld(regionIds, (done, total) =>
        setDeployProgress(worldId, { step: "testing", total, results: done }),
      ),
    );

  const Surface = card.component;
  const redChecks = boot?.ok && !boot.reference && !boot.passed ? boot : null;
  const open = boot?.ok && (boot.reference || boot.passed) ? boot : null;
  const failedRegions = redChecks ? [...new Set(redChecks.checks.filter(c => !c.passed).map(c => c.region))] : [];

  // The world handed to the surface, with its reads and writes logged to the console.
  const loggedWorld = useMemo<World | null>(
    () => (open ? makeLoggedWorld(open.world, entry => appendConsoleEntry(worldId, entry)) : null),
    [open, worldId, appendConsoleEntry],
  );

  return (
    <CardFrame card={card}>
      <Markdown className="text-lg leading-[1.62] text-lab-text mb-4">{card.scenario}</Markdown>

      {(card.illustrations ?? []).map((Illustration, index) => (
        <div key={index} className="mb-5">
          <Illustration />
        </div>
      ))}

      {crash && (
        <div className="alert alert-error text-sm mb-3">
          <span className="font-mono whitespace-pre-wrap break-all">{crash}</span>
        </div>
      )}

      {missing.length > 0 && boot === null ? (
        // fill-gate: nothing of the learner's to ship yet (and not already deployed)
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
        // green: the surface gets the stage (or the labelled reference world)
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
          epoch={epoch}
          revealed={revealed}
          onRevealed={() => markRevealed(worldId)}
          defaultOpen={card.console === "open"}
        />
      )}
    </CardFrame>
  );
};

// Mounts its surface on a world an earlier card deployed (named by
// card.reusesWorld), never deploying its own. If that world isn't deployed yet,
// it links back to the card that deploys it.
const ReuseWorldCard = ({ card, lab }: Props) => {
  const worldId = card.reusesWorld as string;
  const world = useLabStore(s => s.worlds[worldId]);
  const appendConsoleEntry = useLabStore(s => s.appendConsoleEntry);
  const markRevealed = useLabStore(s => s.markRevealed);
  const goTo = useLabStore(s => s.goTo);
  const owner = useMemo(() => findSharer(lab, worldId), [lab, worldId]);

  const boot = world?.boot ?? null;
  // the deployed world, if it reached a mountable (green or reference) state
  const open = boot?.ok && (boot.passed || boot.reference) ? boot : null;
  const loggedWorld = useMemo<World | null>(
    () => (open ? makeLoggedWorld(open.world, entry => appendConsoleEntry(worldId, entry)) : null),
    [open, worldId, appendConsoleEntry],
  );

  const Surface = card.component;

  return (
    <CardFrame card={card}>
      <Markdown className="text-base-content/90 leading-relaxed mb-4">{card.scenario}</Markdown>

      {(card.illustrations ?? []).map((Illustration, index) => (
        <div key={index} className="mb-5">
          <Illustration />
        </div>
      ))}

      {!open ? (
        // the owner hasn't shipped a live contract yet — point back, never self-deploy
        <div className="flex flex-col gap-3">
          <div className="rounded-box border border-base-300 bg-base-200/60 px-4 py-3">
            <p className="text-sm text-base-content/80 m-0">
              No live contract yet — deploy it on{" "}
              <span className="font-medium">{owner ? owner.card.title : "the deploy card"}</span> first, then come back
              here to use it.
            </p>
          </div>
          {owner && (
            <button
              className="btn btn-primary btn-sm gap-2 self-start"
              onClick={() => goTo(owner.chapterIndex, owner.cardIndex)}
            >
              <RocketLaunchIcon className="w-4 h-4" />
              Go deploy it
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {open.reference && (
            <p className="text-xs text-base-content/50 m-0">reading the reference solution, not your code</p>
          )}
          {Surface && loggedWorld && <Surface key={world?.epoch ?? 0} world={loggedWorld} />}
        </div>
      )}

      {card.console && (
        <Console
          progress={world?.progress ?? null}
          boot={world?.boot ?? null}
          crash={world?.crash ?? null}
          interactions={world?.log ?? []}
          epoch={world?.epoch ?? 0}
          revealed={world?.revealed ?? false}
          onRevealed={() => markRevealed(worldId)}
          defaultOpen={card.console === "open"}
        />
      )}
    </CardFrame>
  );
};
