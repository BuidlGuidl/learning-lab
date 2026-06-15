// The console: a view of chain activity inside this card's in-browser EVM —
// the deploy landing, then every read and write the learner runs against the
// live contract. Opt-in per card (a deploy card always has one; an experiment
// surface can mount one under its UI). Collapsible, like the tests panel.
// Values are raw — the console is generic, it can't know units, so a uint goal
// reads as its wei, exactly like cast or hardhat would dump it.
import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { short } from "~~/lib/lab/format";
import type { ExperimentBoot } from "~~/lib/lab/learner-world";
import type { RunProgress } from "~~/lib/lab/run";

type Tone = "muted" | "info" | "ok" | "error";
type Line = { tone: Tone; text: string; indent?: boolean };

// One logged interaction: a read or a write the learner ran against the live
// contract. The card wraps world.read/write to append these.
export type ConsoleEntry =
  | { kind: "read"; contract: string; fn: string; args: unknown[]; result?: unknown; error?: string }
  | {
      kind: "write";
      contract: string;
      fn: string;
      args: unknown[];
      from?: string;
      value?: bigint;
      ok: boolean;
      error?: string;
    };

type Props = {
  progress: RunProgress | null; // non-null while a deploy is live
  boot: ExperimentBoot | null; // the settled deploy result; null before the first deploy
  crash: string | null; // an unexpected failure (worker death, deploy script throw)
  interactions: ConsoleEntry[]; // reads/writes since the current deploy
  defaultOpen?: boolean; // start expanded (deploy beat) vs folded (a surface's log)
};

const toneClass: Record<Tone, string> = {
  muted: "text-base-content/45",
  info: "text-base-content/80",
  ok: "text-success",
  error: "text-error",
};

const formatValue = (value: unknown): string =>
  typeof value === "bigint"
    ? value.toString()
    : typeof value === "string"
      ? value
      : value === undefined
        ? ""
        : JSON.stringify(value, (_key, nested) => (typeof nested === "bigint" ? nested.toString() : nested));

const formatArgs = (args: unknown[]) => args.map(formatValue).join(", ");

// The deploy lifecycle, top of the log. A failed compile is kept to one line —
// the card's failure UI shows the actual solc errors, no need to repeat them.
function deployLines(progress: RunProgress | null, boot: ExperimentBoot | null, crash: string | null): Line[] {
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
      ];
    }
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

function interactionLines(entries: ConsoleEntry[]): Line[] {
  return entries.map((entry): Line => {
    if (entry.kind === "read") {
      const callText = `read ${entry.contract}.${entry.fn}(${formatArgs(entry.args)})`;
      return entry.error
        ? { tone: "error", text: `${callText} → ✗ ${entry.error}` }
        : { tone: "muted", text: `${callText} → ${formatValue(entry.result)}` };
    }
    const fromClause = entry.from ? ` from ${short(entry.from)}` : "";
    const valueClause = entry.value !== undefined ? ` value ${entry.value.toString()}` : "";
    const callText = `${entry.contract}.${entry.fn}(${formatArgs(entry.args)})${fromClause}${valueClause}`;
    return entry.ok
      ? { tone: "ok", text: `${callText} → ✓` }
      : { tone: "error", text: `${callText} → ✗ ${entry.error ?? "revert"}` };
  });
}

const status = (progress: RunProgress | null, boot: ExperimentBoot | null, crash: string | null) => {
  if (progress) return { label: "running", cls: "text-base-content/50" };
  if (crash || boot?.ok === false) return { label: "failed", cls: "badge badge-sm badge-error" };
  if (boot?.ok) return { label: "deployed", cls: "badge badge-sm badge-success" };
  return { label: "idle", cls: "text-base-content/40" };
};

export const Console = ({ progress, boot, crash, interactions, defaultOpen = false }: Props) => {
  const lines = [...deployLines(progress, boot, crash), ...interactionLines(interactions)];
  const consoleStatus = status(progress, boot, crash);
  const live = progress !== null;

  // A titled box you click to open. Controlled by state, not a raw `open`
  // attribute: interactions append and re-render the console, which would
  // otherwise snap `open` back to defaultOpen and fight the learner's toggle.
  // When open, the body scrolls inside its own cap so a long log never grows
  // the page.
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <details
      open={isOpen}
      onToggle={event => setIsOpen(event.currentTarget.open)}
      className="group mt-4 overflow-hidden rounded-box border border-base-300 bg-base-300/30"
    >
      <summary className="flex cursor-pointer select-none list-none items-center justify-between border-b border-transparent bg-base-300/40 px-4 py-2 transition-colors group-open:border-base-300">
        <span className="flex items-center gap-1.5">
          <ChevronRightIcon className="h-3 w-3 text-base-content/40 transition-transform group-open:rotate-90" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-base-content/50">console</span>
        </span>
        <span
          className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${consoleStatus.cls}`}
        >
          {live && <span className="loading loading-spinner loading-xs" />}
          {consoleStatus.label}
        </span>
      </summary>

      <div className="max-h-80 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap break-all ${line.indent ? "pl-4" : ""} ${toneClass[line.tone]}`}
          >
            {line.text}
          </div>
        ))}
      </div>
    </details>
  );
};
