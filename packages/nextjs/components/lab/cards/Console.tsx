// The console: a view of chain activity inside this card's in-browser EVM —
// the deploy landing, then every read and write the learner runs against the
// live contract. Opt-in per card (a deploy card always has one; an experiment
// surface can mount one under its UI). Collapsible, like the tests panel.
// Values are raw — the console is generic, it can't know units, so a uint goal
// reads as its wei, exactly like cast or hardhat would dump it.
import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { short } from "~~/lib/lab/format";
import type { ExperimentBoot } from "~~/lib/lab/learner-world";
import type { RunProgress } from "~~/lib/lab/run";

type Tone = "muted" | "info" | "ok" | "error";
// a bytecode line carries its full hex so the row can unfurl the actual payload
type Line = { tone: Tone; text: string; indent?: boolean; bytecode?: string };

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
  defaultOpen?: boolean; // start expanded (a deploy card) vs folded (a surface's log)
  epoch?: number; // bumps on each successful deploy — replays the receipt reveal
  revealed?: boolean; // receipt already animated once — render it static, don't re-type
  onRevealed?: () => void; // fired when the receipt finishes typing, to persist `revealed`
};

const REVEAL_MS = 120; // per-line delay for the typewriter reveal

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

// Head + tail of the deploy payload — enough to show the 0x60806040 Solidity
// prologue without dumping kilobytes of hex into the receipt line.
const bytecodePreview = (code: string) => `${code.slice(0, 10)}…${code.slice(-4)}`;

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
      if (handle.deployment?.bytecode) {
        const code = handle.deployment.bytecode;
        const byteCount = (code.length - 2) / 2;
        lines.push({
          tone: "muted",
          text: `bytecode  ${bytecodePreview(code)} · ${byteCount.toLocaleString()} bytes`,
          bytecode: code,
        });
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

export const Console = ({
  progress,
  boot,
  crash,
  interactions,
  defaultOpen = false,
  epoch = 0,
  revealed = false,
  onRevealed,
}: Props) => {
  const lines = [...deployLines(progress, boot, crash), ...interactionLines(interactions)];
  const consoleStatus = status(progress, boot, crash);
  const live = progress !== null;

  // A titled box you click to open. Controlled by state, not a raw `open`
  // attribute: interactions append and re-render the console, which would
  // otherwise snap `open` back to defaultOpen and fight the learner's toggle.
  // When open, the body scrolls inside its own cap so a long log never grows
  // the page.
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Typewriter reveal: lines appear one at a time. A fresh deploy (epoch change)
  // replays the receipt from the top; an already-revealed world mounts straight
  // to its end, so navigating back shows it static. New interaction lines still
  // type in as they land; live phases appear at once.
  const [shown, setShown] = useState(() => (revealed ? lines.length : 0));

  // Re-animate only on an actual redeploy (epoch change), not on remount.
  const lastEpoch = useRef(epoch);
  useEffect(() => {
    if (lastEpoch.current === epoch) return;
    lastEpoch.current = epoch;
    setShown(0);
  }, [epoch]);

  // which bytecode rows the learner has unfurled; collapse them when a new
  // deploy replays the receipt from the top.
  const [openBytecode, setOpenBytecode] = useState<Set<number>>(() => new Set());
  useEffect(() => setOpenBytecode(new Set()), [epoch]);
  useEffect(() => {
    if (live) {
      setShown(lines.length);
      return;
    }
    if (shown >= lines.length) return;
    const timer = setTimeout(() => setShown(count => count + 1), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [live, shown, lines.length]);
  const visible = Math.min(shown, lines.length);
  const typing = !live && visible < lines.length;

  // Once the receipt finishes typing, persist it so a later mount renders it static.
  useEffect(() => {
    if (!live && !revealed && lines.length > 0 && visible >= lines.length) onRevealed?.();
  }, [live, revealed, visible, lines.length, onRevealed]);

  // keep the write-head in view as lines reveal/append inside the capped body
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [visible]);

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

      <div ref={bodyRef} className="max-h-80 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed">
        {lines.slice(0, visible).map((line, index) => {
          const cursor = typing && index === visible - 1 ? <span className="ml-0.5 animate-pulse">▋</span> : null;

          // the bytecode row: a chevron sits in the indent gutter (caret + gap
          // ≈ pl-4, so "bytecode" aligns under "gas used"/"tx"), and clicking
          // unfurls the full payload in a success-tinted dump below.
          if (line.bytecode) {
            const open = openBytecode.has(index);
            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenBytecode(prev => {
                      const next = new Set(prev);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    })
                  }
                  className={`flex w-full items-center gap-1 text-left transition-colors hover:text-base-content/75 ${toneClass[line.tone]}`}
                >
                  <ChevronRightIcon
                    className={`h-3 w-3 shrink-0 text-base-content/40 transition-transform ${open ? "rotate-90" : ""}`}
                  />
                  <span className="whitespace-pre-wrap break-all">{line.text}</span>
                  {cursor}
                </button>
                {open && (
                  <pre className="ml-4 mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap break-all rounded-sm bg-base-300/50 py-2 pl-3 pr-2 text-[11px] leading-relaxed text-base-content/45">
                    {line.bytecode}
                  </pre>
                )}
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`whitespace-pre-wrap break-all ${line.indent ? "pl-4" : ""} ${toneClass[line.tone]}`}
            >
              {line.text}
              {cursor}
            </div>
          );
        })}
      </div>
    </details>
  );
};
