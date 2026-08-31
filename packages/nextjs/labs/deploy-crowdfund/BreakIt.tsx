"use client";

// Attack your own refund rules, as a guided beat: fund the campaign, demand a
// refund while the window is still open, fast-forward the chain, refund for
// real, then try to refund twice. Every refusal is a require the learner wrote.
import { useCallback, useEffect, useState } from "react";
import { FUNDING_WINDOW_S } from "./deploy";
import { formatEther } from "viem";
import {
  ArrowUturnLeftIcon,
  BuildingLibraryIcon,
  ClockIcon,
  ForwardIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { World } from "~~/lib/lab/harness";

type Props = { world: World };

const ONE_DAY_S = 24n * 60n * 60n;
const ONE_ETH = 10n ** 18n;

// keyed by the exact reason strings the refund exercise asked for
const REVERTS: Record<string, { line: string; lesson: string }> = {
  "funding still open": {
    line: 'require(block.timestamp >= deadline, "funding still open");',
    lesson:
      "Your deadline rule fired. The window is still open, so the deal says the money stays in until it closes. The whole transaction rolled back, and the gas for the attempt was still paid: the network ran your rule, and running rules is work.",
  },
  "nothing to refund": {
    line: 'require(amount > 0, "nothing to refund");',
    lesson:
      "Your ledger rule fired. The first refund zeroed this contributor's row, so the second ask found nothing under their name. That zero-first habit is exactly what makes the double-refund impossible.",
  },
};

const explainRevert = (raw: string | null) => {
  if (!raw) return null;
  for (const reason of Object.keys(REVERTS)) {
    if (raw.includes(reason)) return { reason, ...REVERTS[reason] };
  }
  return null;
};

const Step = ({
  n,
  activeStep,
  busy,
  icon: Icon,
  text,
  action,
  actionLabel,
  tag,
  done,
  doneNote,
}: {
  n: number;
  activeStep: number;
  busy: string | null;
  icon: typeof ClockIcon;
  text: string;
  action: () => void;
  actionLabel: string;
  tag: string;
  done: boolean;
  doneNote: string;
}) => (
  <div
    className={`rounded-box px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${activeStep === n ? "" : "opacity-70"}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <Icon
        className={`w-5 h-5 shrink-0 ${done ? "text-lab-mint" : activeStep === n ? "text-lab-violet" : "text-base-content/40"}`}
      />
      <span className="text-sm text-base-content/80">{done ? doneNote : text}</span>
    </div>
    {!done && (
      <button
        className={`btn btn-sm gap-2 shrink-0 ${activeStep === n ? "btn-primary" : ""}`}
        onClick={action}
        disabled={busy !== null || activeStep !== n}
      >
        {busy === tag && <span className="loading loading-spinner loading-xs" />}
        {actionLabel}
      </button>
    )}
  </div>
);

export const BreakIt = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  const contributor = world.accounts[1];

  const [pool, setPool] = useState<bigint>(0n);
  const [deadline, setDeadline] = useState<bigint | null>(null);
  const [now, setNow] = useState<bigint | null>(null);
  const [funded, setFunded] = useState(false);
  const [earlyReason, setEarlyReason] = useState<string | null>(null);
  const [refunded, setRefunded] = useState(false);
  const [againReason, setAgainReason] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRevert, setLastRevert] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [poolBal, deadlineV, block] = await Promise.all([
      world.client.getBalance({ address: crowdfund.address }),
      world.read(crowdfund, "deadline") as Promise<bigint>,
      world.client.getBlock(),
    ]);
    setPool(poolBal);
    setDeadline(deadlineV);
    setNow(block.timestamp);
  }, [world, crowdfund]);

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message));
  }, [refresh]);

  const run = async (tag: string, action: () => Promise<void>) => {
    setBusy(tag);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const fund = () =>
    run("fund", async () => {
      const result = await world.write(crowdfund, "fund", { from: contributor, value: ONE_ETH });
      if (result.errors?.length) throw new Error(result.errors[0].message);
      setFunded(true);
      setLastRevert(null);
    });

  const refundEarly = () =>
    run("early", async () => {
      const result = await world.write(crowdfund, "refund", { from: contributor });
      const fail = result.errors?.[0];
      const reason = fail ? (fail.message ?? fail.name ?? "reverted") : null;
      setEarlyReason(reason);
      setLastRevert(reason);
    });

  const passDeadline = () =>
    run("clock", async () => {
      const mine = world.client.tevmMine as unknown as (p: { blockCount: number; interval: number }) => Promise<void>;
      await mine({ blockCount: 2, interval: Number(FUNDING_WINDOW_S + ONE_DAY_S) });
      setLastRevert(null);
    });

  const refundForReal = () =>
    run("refund", async () => {
      const result = await world.write(crowdfund, "refund", { from: contributor });
      if (result.errors?.length) throw new Error(result.errors[0].message);
      setRefunded(true);
      setLastRevert(null);
    });

  const refundAgain = () =>
    run("again", async () => {
      const result = await world.write(crowdfund, "refund", { from: contributor });
      const fail = result.errors?.[0];
      const reason = fail ? (fail.message ?? fail.name ?? "reverted") : null;
      setAgainReason(reason);
      setLastRevert(reason);
    });

  const closed = deadline !== null && now !== null && now >= deadline;
  const step = !funded ? 1 : earlyReason === null ? 2 : !closed ? 3 : !refunded ? 4 : againReason === null ? 5 : 6;
  const daysLeft =
    deadline !== null && now !== null ? Math.max(0, Math.ceil(Number(deadline - now) / Number(ONE_DAY_S))) : null;
  const revert = explainRevert(lastRevert);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the pool</span>
          <span className="font-mono text-2xl tabular-nums">{formatEther(pool)} ETH</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the window</span>
          <span className={`font-mono text-2xl tabular-nums ${closed ? "text-peach-deep dark:text-peach-bright" : ""}`}>
            {daysLeft === null ? "…" : closed ? "closed" : `${daysLeft} days left`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Step
          n={1}
          activeStep={step}
          busy={busy}
          icon={BuildingLibraryIcon}
          text="Put money on the line: contribute 1 ETH to the campaign."
          action={fund}
          actionLabel="fund 1 ETH"
          tag="fund"
          done={funded}
          doneNote="1 ETH is in the pool, under your name in the ledger."
        />
        <Step
          n={2}
          activeStep={step}
          busy={busy}
          icon={ArrowUturnLeftIcon}
          text="Now change your mind and demand it back, mid-campaign."
          action={refundEarly}
          actionLabel="refund now"
          tag="early"
          done={earlyReason !== null}
          doneNote={
            earlyReason
              ? "Refused. The window is still open, exactly as your first require says."
              : "That went through mid-campaign, which means your deadline check is missing. Look at your refund() lines."
          }
        />
        <Step
          n={3}
          activeStep={step}
          busy={busy}
          icon={ForwardIcon}
          text="No admin can bend the rule, but time satisfies it. Fast-forward the chain past the deadline."
          action={passDeadline}
          actionLabel="mine ~8 days"
          tag="clock"
          done={closed}
          doneNote="The deadline is behind you and the campaign came up short of 10 ETH."
        />
        <Step
          n={4}
          activeStep={step}
          busy={busy}
          icon={ArrowUturnLeftIcon}
          text="Same request, same button. Ask for the refund again."
          action={refundForReal}
          actionLabel="refund"
          tag="refund"
          done={refunded}
          doneNote="Your 1 ETH came back. Nobody approved it; the conditions were simply met."
        />
        <Step
          n={5}
          activeStep={step}
          busy={busy}
          icon={ArrowUturnLeftIcon}
          text="One more try. Can you refund what was already refunded?"
          action={refundAgain}
          actionLabel="refund again"
          tag="again"
          done={againReason !== null}
          doneNote={
            againReason
              ? "Refused. Your ledger row is zero, so there is nothing left to claim."
              : "That went through twice, which means the ledger isn't being zeroed. Look at your refund() lines."
          }
        />
      </div>

      {revert && (
        <div className="rounded-box border px-4 py-3 flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-lab-violet shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="m-0 text-sm font-semibold">Refused. That was your rule, not an error.</p>
            <p className="m-0 text-sm text-base-content/80">{revert.lesson}</p>
            <code className="block break-all font-mono text-xs">{revert.line}</code>
            <p className="m-0 font-mono text-xs text-base-content/40">reverted with &ldquo;{revert.reason}&rdquo;</p>
          </div>
        </div>
      )}

      {error && <span className="text-xs text-lab-error font-mono break-all">{error}</span>}
    </div>
  );
};
