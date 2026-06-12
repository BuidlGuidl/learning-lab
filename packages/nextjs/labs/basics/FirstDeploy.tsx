"use client";

// The basics lab's first deploy beat: read the storage slot back from the
// live contract. The surface is deliberately narrow — just the getter the
// learner earned in chapter 1. The world also carries canonical code for
// regions from later chapters; not showing it is what keeps a mid-lab
// deployment honest.
import { useState } from "react";
import type { Address, World } from "~~/lib/lab/harness";

type Props = { world: World };

const short = (a: Address) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const FirstDeploy = ({ world }: Props) => {
  const counter = world.contracts.Counter;
  const [value, setValue] = useState<bigint | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const readNumber = async () => {
    setReading(true);
    setReadError(null);
    try {
      setValue((await world.read(counter, "number")) as bigint);
    } catch (e) {
      setReadError((e as Error).message);
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box bg-base-200 px-5 py-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">Counter.number</div>
          <div className="text-5xl font-mono tabular-nums leading-none">{value === null ? "?" : value.toString()}</div>
        </div>
        <div className="text-right text-xs font-mono text-base-content/40">
          <div>live on this tab&apos;s chain at</div>
          <div>{short(counter.address)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content/70">
          Your <code className="font-mono">public</code> keyword gave the contract a free getter. Call it.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn btn-sm btn-outline gap-2 normal-case font-mono"
            onClick={readNumber}
            disabled={reading}
          >
            {reading && <span className="loading loading-spinner loading-xs" />}
            read number()
          </button>
          {value !== null && (
            <span className="text-xs text-base-content/50">that&apos;s your declaration, answering from the chain</span>
          )}
        </div>
        {readError && <span className="text-xs text-error font-mono break-all">{readError}</span>}
      </div>
    </div>
  );
};
