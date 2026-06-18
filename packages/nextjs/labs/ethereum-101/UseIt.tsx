"use client";

// The contract as an app: fund from three browser accounts, watch the goal
// bar and the public ledger move. Every click is a real transaction against
// the learner's own code.
//
// TODO(revamp): this is the minimal cut of carlos's card 22. The full
// playground adds fast-forwarding past the deadline, pulling a refund
// (watching the ledger zero out), and the creator's claim when the goal
// is hit. Build it as the next iteration of this component.
import { useCallback, useEffect, useState } from "react";
import { formatEther } from "viem";
import { short } from "~~/lib/lab/format";
import type { Address, World } from "~~/lib/lab/harness";

type Props = { world: World };

const FUND_AMOUNT = 2n * 10n ** 18n;

type Funder = { address: Address; contribution: bigint };

export const UseIt = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  const [goal, setGoal] = useState<bigint | null>(null);
  const [raised, setRaised] = useState<bigint>(0n);
  const [funders, setFunders] = useState<Funder[]>([]);
  const [busy, setBusy] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const addresses = world.accounts.slice(1, 4);
    const [goalValue, balance, ...contributions] = await Promise.all([
      world.read(crowdfund, "GOAL") as Promise<bigint>,
      world.client.getBalance({ address: crowdfund.address }),
      ...addresses.map(a => world.read(crowdfund, "contributions", [a]) as Promise<bigint>),
    ]);
    setGoal(goalValue);
    setRaised(balance);
    setFunders(addresses.map((address, i) => ({ address, contribution: contributions[i] })));
  }, [world, crowdfund]);

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message));
  }, [refresh]);

  const fund = async (from: Address) => {
    setBusy(from);
    setError(null);
    try {
      const result = await world.write(crowdfund, "fund", { from, value: FUND_AMOUNT });
      if (result.errors?.length) {
        setError(result.errors[0].message ?? result.errors[0].name ?? "fund reverted");
        return;
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const goalReached = goal !== null && raised >= goal;
  const goalEth = goal === null ? 0 : Number(formatEther(goal));
  const raisedEth = Number(formatEther(raised));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box bg-base-200 px-5 py-4">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <div className="text-xs font-mono uppercase tracking-wider text-base-content/50">raised</div>
          <div className="font-mono text-sm">
            <span className="text-2xl tabular-nums">{formatEther(raised)}</span>
            <span className="text-base-content/50"> / {goal === null ? "…" : formatEther(goal)} ETH</span>
          </div>
        </div>
        <progress className="progress progress-success w-full" value={raisedEth} max={goalEth || 1} />
        {goalReached && (
          <p className="text-sm text-success font-medium mt-2 mb-0">
            Goal reached — the deal flips: no more refunds, the creator can claim.
          </p>
        )}
      </div>

      <div className="rounded-box bg-base-200 px-5 py-4 flex flex-col gap-2.5">
        <div className="text-xs font-mono uppercase tracking-wider text-base-content/50">
          the public ledger · contributions
        </div>
        {funders.map(f => (
          <div key={f.address} className="flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-sm text-base-content/80" title={f.address}>
              {short(f.address)}
            </span>
            <span className="font-mono text-sm tabular-nums">{formatEther(f.contribution)} ETH</span>
            <button
              className="btn btn-sm btn-outline gap-2 normal-case font-mono"
              onClick={() => fund(f.address)}
              disabled={busy !== null}
            >
              {busy === f.address && <span className="loading loading-spinner loading-xs" />}
              fund 2 ETH
            </button>
          </div>
        ))}
      </div>

      <span className="text-sm font-medium text-base-content/70">
        Each click signs a real transaction from that account into <em>your</em> fund(). The ledger rows are public
        reads of the mapping you declared — anyone on the network could read them too.
      </span>
      {error && <span className="text-xs text-error font-mono break-all">{error}</span>}
    </div>
  );
};
