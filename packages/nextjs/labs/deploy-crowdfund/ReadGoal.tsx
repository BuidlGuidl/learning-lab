"use client";

// Reads GOAL off the deployed contract and shows it. The read runs against the
// live world, so it also lands in the console log.
import { useState } from "react";
import { formatEther } from "viem";
import type { World } from "~~/lib/lab/harness";

type Props = { world: World };

export const ReadGoal = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  const [goal, setGoal] = useState<bigint | null>(null);
  const [reading, setReading] = useState(false);

  const read = async () => {
    setReading(true);
    try {
      setGoal((await world.read(crowdfund, "GOAL")) as bigint);
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="rounded-box px-5 py-4 flex flex-col gap-3 items-start">
      <p className="text-sm text-base-content/80 m-0">
        It&apos;s a real contract now, with public state. Ask it for the <code className="font-mono">GOAL</code> you set
        — the answer comes straight from on-chain, not the source file.
      </p>
      <button className="btn btn-primary btn-sm gap-2" onClick={read} disabled={reading}>
        {reading && <span className="loading loading-spinner loading-xs" />}
        Read GOAL
      </button>
      {goal !== null && (
        <p className="font-mono text-sm m-0">
          <span className="text-base-content/60">GOAL</span> ={" "}
          <span className="text-lab-mint tabular-nums">{formatEther(goal)} ETH</span>
        </p>
      )}
    </div>
  );
};
