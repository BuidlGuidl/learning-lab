"use client";

// Ethereum 101's first deploy beat: the receipt, then read GOAL back from
// the live contract. The surface stays narrow — one constant, the one the
// learner just wrote. The deploy is the story here: a real transaction,
// real gas, a real address, all inside this tab's EVM.
import { useState } from "react";
import { formatEther } from "viem";
import type { Address, World } from "~~/lib/lab/harness";

type Props = { world: World };

const short = (a: Address) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const ReadGoal = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  const [goal, setGoal] = useState<bigint | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const readGoal = async () => {
    setReading(true);
    setReadError(null);
    try {
      setGoal((await world.read(crowdfund, "GOAL")) as bigint);
    } catch (e) {
      setReadError((e as Error).message);
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box bg-base-200 px-5 py-4 flex flex-wrap gap-x-8 gap-y-2">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">deployed at</div>
          <div className="font-mono text-sm" title={crowdfund.address}>
            {short(crowdfund.address)}
          </div>
        </div>
        {crowdfund.deployment?.gasUsed !== undefined && (
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">gas used</div>
            <div className="font-mono text-sm">{crowdfund.deployment.gasUsed.toLocaleString()}</div>
          </div>
        )}
        {crowdfund.deployment?.txHash && (
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">transaction</div>
            <div className="font-mono text-sm" title={crowdfund.deployment.txHash}>
              {short(crowdfund.deployment.txHash as Address)}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-box bg-base-200 px-5 py-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">Crowdfund.GOAL</div>
          <div className="text-5xl font-mono tabular-nums leading-none">
            {goal === null ? "?" : `${formatEther(goal)} ETH`}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content/70">
          That deploy was a transaction: it cost gas and the bytecode now lives at that address. Ask the chain for the
          constant you wrote — not the source file, the live contract.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-sm btn-outline gap-2 normal-case font-mono" onClick={readGoal} disabled={reading}>
            {reading && <span className="loading loading-spinner loading-xs" />}
            read GOAL()
          </button>
          {goal !== null && <span className="text-xs text-base-content/50">your line, answering from the chain</span>}
        </div>
        {readError && <span className="text-xs text-error font-mono break-all">{readError}</span>}
      </div>
    </div>
  );
};
