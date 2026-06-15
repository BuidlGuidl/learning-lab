// The deploy terminal. Always on screen next to the tests panel, it narrates
// the one thing the checklist doesn't: the contract actually landing on the
// in-browser chain. Idle it just waits; live it echoes the phase; on a result
// it plays the hardhat-style receipt — deploying… ✓ deployed at 0x… gas, tx —
// one line at a time so the learner watches it ship. Pure view: every line is
// derived from state the card already holds (progress, boot, crash), so there
// is no new deploy plumbing to keep in sync.
import { useEffect, useMemo, useState } from "react";
import { short } from "~~/lib/lab/format";
import type { ExperimentBoot } from "~~/lib/lab/learner-world";
import type { RunProgress } from "~~/lib/lab/run";

type Tone = "muted" | "info" | "ok" | "error";
type Line = { tone: Tone; text: string; indent?: boolean };

type Props = {
  progress: RunProgress | null; // non-null while a deploy is live
  boot: ExperimentBoot | null; // the settled result; null before the first deploy
  crash: string | null; // an unexpected failure (worker death, deploy script throw)
  epoch: number; // bumps on every successful deploy, so the reveal replays
};

const toneClass: Record<Tone, string> = {
  muted: "text-base-content/45",
  info: "text-base-content/80",
  ok: "text-success",
  error: "text-error",
};

// One terminal's worth of lines for the current state. Order of precedence:
// a crash trumps everything, then a live run, then a settled result, then idle.
function linesFor(progress: RunProgress | null, boot: ExperimentBoot | null, crash: string | null): Line[] {
  if (crash) return [{ tone: "error", text: `✗ ${crash}` }];

  if (progress) {
    if (progress.step === "fetching-compiler") return [{ tone: "muted", text: "fetching compiler…" }];
    if (progress.step === "compiling") return [{ tone: "info", text: "compiling…" }];
    // the testing step gates the surface but stays unnamed — to the learner
    // this is just the deploy still in flight.
    return [
      { tone: "ok", text: "✓ compiled" },
      { tone: "info", text: "deploying…" },
    ];
  }

  if (boot) {
    if (!boot.ok) {
      return [
        { tone: "info", text: "compiling…" },
        { tone: "error", text: "✗ compilation failed" },
        ...boot.errors.map((e): Line => ({ tone: "error", text: e, indent: true })),
      ];
    }
    // ok: a world booted, even on red checks or the reference run — the
    // contracts are live, so show the receipt for each one.
    const lines: Line[] = [
      { tone: "info", text: "compiling…" },
      { tone: "ok", text: "✓ compiled" },
    ];
    for (const [name, handle] of Object.entries(boot.world.contracts)) {
      lines.push({ tone: "info", text: `deploying ${name}…` });
      lines.push({ tone: "ok", text: `✓ deployed at ${handle.address}` });
      if (handle.deployment?.gasUsed !== undefined) {
        lines.push({ tone: "muted", text: `gas used  ${handle.deployment.gasUsed.toLocaleString()}`, indent: true });
      }
      if (handle.deployment?.txHash) {
        lines.push({ tone: "muted", text: `tx        ${short(handle.deployment.txHash)}`, indent: true });
      }
    }
    return lines;
  }

  return [{ tone: "muted", text: "press Deploy to compile and ship your contract" }];
}

const status = (progress: RunProgress | null, boot: ExperimentBoot | null, crash: string | null) => {
  if (progress) return { label: "running", cls: "text-base-content/50" };
  if (crash || boot?.ok === false) return { label: "failed", cls: "badge badge-sm badge-error" };
  if (boot?.ok) return { label: "deployed", cls: "badge badge-sm badge-success" };
  return { label: "idle", cls: "text-base-content/40" };
};

export const DeployConsole = ({ progress, boot, crash, epoch }: Props) => {
  const lines = useMemo(() => linesFor(progress, boot, crash), [progress, boot, crash]);

  // Only the settled receipt earns the typewriter reveal; live and error lines
  // appear at once. Re-keyed on epoch so a redeploy replays the whole receipt.
  const reveal = boot?.ok === true && progress === null;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!reveal) {
      setShown(lines.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= lines.length) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [reveal, epoch, lines.length]);

  const st = status(progress, boot, crash);
  const live = progress !== null;

  return (
    <div className="mt-4 overflow-hidden rounded-box border border-base-300 bg-base-300/30">
      <div className="flex items-center justify-between border-b border-base-300 bg-base-300/40 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-base-content/50">deploy</span>
        <span className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${st.cls}`}>
          {live && <span className="loading loading-spinner loading-xs" />}
          {st.label}
        </span>
      </div>

      <div className="px-4 py-3 font-mono text-xs leading-relaxed">
        {lines.slice(0, shown).map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${line.indent ? "pl-4" : ""} ${toneClass[line.tone]}`}>
            {line.text}
            {reveal && i === shown - 1 && shown < lines.length && <span className="ml-0.5 animate-pulse">▋</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
