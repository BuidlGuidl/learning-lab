"use client";

// The capstone surface: the finished crowdfund, live. Every check earned in
// the lab already ran green at the door; here the learner inspects the real
// thing — the receipt, then the contract's own answers. The interactive
// playground (fund from accounts, watch the bar, pull a refund) is a later
// iteration; this surface keeps to what the learner built.
import { useState } from "react";
import { formatEther } from "viem";
import type { Address, World } from "~~/lib/lab/harness";

type Props = { world: World };

const short = (a: Address) => `${a.slice(0, 6)}…${a.slice(-4)}`;

type Answers = { goal: bigint; creator: Address; deadline: bigint; balance: bigint };

export const ShipIt = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const inspect = async () => {
    setReading(true);
    setReadError(null);
    try {
      const [goal, creator, deadline, balance] = await Promise.all([
        world.read(crowdfund, "GOAL") as Promise<bigint>,
        world.read(crowdfund, "creator") as Promise<Address>,
        world.read(crowdfund, "deadline") as Promise<bigint>,
        world.client.getBalance({ address: crowdfund.address }),
      ]);
      setAnswers({ goal, creator, deadline, balance });
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

      {answers && (
        <div className="rounded-box bg-base-200 px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">GOAL</div>
            <div className="font-mono text-lg">{formatEther(answers.goal)} ETH</div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">creator</div>
            <div className="font-mono text-lg" title={answers.creator}>
              {short(answers.creator)}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">deadline</div>
            <div className="font-mono text-lg">{new Date(Number(answers.deadline) * 1000).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">raised</div>
            <div className="font-mono text-lg">{formatEther(answers.balance)} ETH</div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content/70">
          The escrow agent, the ledger, the referee — all of it is this one contract now. Ask it.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-sm btn-outline gap-2 normal-case font-mono" onClick={inspect} disabled={reading}>
            {reading && <span className="loading loading-spinner loading-xs" />}
            {answers ? "read again" : "inspect the contract"}
          </button>
          {answers && (
            <span className="text-xs text-base-content/50">
              the creator is the account that deployed — that&apos;s you
            </span>
          )}
        </div>
        {readError && <span className="text-xs text-error font-mono break-all">{readError}</span>}
      </div>
    </div>
  );
};
