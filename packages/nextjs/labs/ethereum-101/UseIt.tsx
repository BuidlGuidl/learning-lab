"use client";

// The contract as an app: a trustless escrow you can actually drive. Fund the
// pool from three browser accounts, crank the chain clock past the deadline,
// then watch the deal settle — refunds if it fell short, the creator's claim if
// the goal was hit. Every button is a real transaction against the learner's
// own code; the only thing the UI invents is the staging.
//
// Time only moves by mining: this tevm rejects increaseTime /
// setNextBlockTimestamp, so the clock steps forward by mining blocks, the same
// trick tests.ts uses to land past the deadline.
import {
  type CSSProperties,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FUNDING_WINDOW_S } from "./deploy";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import {
  ArrowDownIcon,
  ArrowUturnLeftIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  ClockIcon,
  ForwardIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import type { Address as Account, World } from "~~/lib/lab/harness";

type Props = { world: World };
type Icon = ComponentType<{ className?: string }>;

const FUND_AMOUNT = 2n * 10n ** 18n;
const ONE_DAY_S = 24n * 60n * 60n;
// how much chain time one "advance" click mines forward — ~4 clicks crosses a
// 7-day window, enough to feel the clock move without dragging it out.
const STEP_S = 2n * ONE_DAY_S;

const eth = (wei: bigint) => formatEther(wei);
const ringStyle = (value: number) => ({ "--value": value, "--size": "9rem", "--thickness": "0.7rem" }) as CSSProperties;

// A reverted write comes back as viem's verbose RevertError dump. Pull the
// human reason out of it and pair it with the exact require() line that fired —
// that's the whole lesson: the UI offered the action, the contract's own line
// refused it. Keyed by the revert string each require carries in Crowdfund.sol.
const REVERTS: Record<string, { line: string; lesson: string }> = {
  "goal was reached": {
    line: 'require(address(this).balance < GOAL, "goal was reached");',
    lesson:
      "Refunds only exist for a campaign that fell short. This one hit its goal, so refund() backs out and the pool stays the creator's to claim.",
  },
  "funding still open": {
    line: 'require(block.timestamp >= deadline, "funding still open");',
    lesson:
      "The deadline hasn't passed yet. Until the clock crosses it the contract holds everyone to the window — no refunds, no claim.",
  },
  "nothing to refund": {
    line: 'require(amount > 0, "nothing to refund");',
    lesson: "This account's row in the ledger is already zero, so there's nothing under its name to pull back.",
  },
  "refund failed": {
    line: 'require(ok, "refund failed");',
    lesson:
      "The creator already claimed, so the pool is empty and the send back has nothing to transfer. The contract reverts the whole call, rolling the zeroed ledger row back with it. All or nothing.",
  },
  "goal not reached": {
    line: 'require(address(this).balance >= GOAL, "goal not reached");',
    lesson:
      "claim() only pays out a campaign that hit its goal. This one came up short, so the funds stay locked for refunds.",
  },
  "only the creator": {
    line: 'require(msg.sender == creator, "only the creator");',
    lesson:
      "Only the account that deployed the contract can claim. The contract checks msg.sender and turns everyone else away.",
  },
  "funding closed": {
    line: 'require(block.timestamp < deadline, "funding closed");',
    lesson: "The window's closed. The contract stops taking new contributions the moment the deadline passes.",
  },
};

// Known reason → tailored card. Any other revert is still framed as a contract
// rejection; a genuine (non-revert) JS error returns null and is shown raw.
const explainRevert = (raw: string | null) => {
  if (!raw) return null;
  for (const reason of Object.keys(REVERTS)) {
    if (raw.includes(reason)) return { reason, ...REVERTS[reason] };
  }
  const m = raw.match(/reverted with the following reason:\s*(.+?)(?:\s+Contract Call:|\s+Details:|\s+Docs:|$)/);
  if (m)
    return {
      reason: m[1].trim(),
      line: "",
      lesson:
        "The UI sent the transaction, but the contract checked its rules and rejected it. The button is only a suggestion; the contract is the deal.",
    };
  return null;
};

// The top-of-stage banner, one branch per state the deal can be in.
type Phase = { tone: string; icon: Icon; label: string; note: string };
const phaseFor = (claimed: boolean, closed: boolean, goalMet: boolean): Phase => {
  if (claimed)
    return {
      tone: "success",
      icon: CheckBadgeIcon,
      label: "Settled",
      note: "the creator swept the pool. Code released the funds — no escrow agent had to sign off.",
    };
  if (closed && goalMet)
    return {
      tone: "success",
      icon: TrophyIcon,
      label: "Deadline passed · goal hit",
      note: "the deal flips: refunds are off, the creator can claim the whole pool.",
    };
  if (closed)
    return {
      tone: "warning",
      icon: LockClosedIcon,
      label: "Deadline passed · came up short",
      note: "no claim for anyone. Every contributor can pull their own ETH back out.",
    };
  if (goalMet)
    return {
      tone: "success",
      icon: CheckBadgeIcon,
      label: "Goal reached",
      note: "the target's hit — advance the clock past the deadline so the creator can claim.",
    };
  return {
    tone: "info",
    icon: BuildingLibraryIcon,
    label: "Funding open",
    note: "contributors can still pay in, and the deadline has time left on it.",
  };
};

// A pill action button that spins on its own `tag` while a write is in flight
// and locks out while any other one runs.
const ActionButton = ({
  busy,
  tag,
  icon: Icon,
  onClick,
  className,
  children,
}: {
  busy: string | null;
  tag: string;
  icon: Icon;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) => (
  <button className={`btn btn-sm gap-2 ${className ?? ""}`} onClick={onClick} disabled={busy !== null}>
    {busy === tag ? <span className="loading loading-spinner loading-xs" /> : <Icon className="w-4 h-4" />}
    {children}
  </button>
);

const SectionLabel = ({ icon: Icon, children }: { icon: Icon; children: ReactNode }) => (
  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-base-content/50">
    <Icon className="w-4 h-4" />
    {children}
  </div>
);

// One account: a blockie + a mono detail line, with whatever action the phase
// allows it. The creator and the contributors share this shell.
const AccountRow = ({
  badge,
  address,
  detail,
  action,
}: {
  badge: ReactNode;
  address: Account;
  detail: ReactNode;
  action: ReactNode;
}) => (
  <div className="rounded-box bg-base-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
    <div className="flex items-center gap-3 min-w-0">
      {badge}
      <div className="flex flex-col gap-0.5 min-w-0">
        <Address address={address} disableAddressLink size="sm" />
        <span className="text-xs font-mono text-base-content/50">{detail}</span>
      </div>
    </div>
    {action}
  </div>
);

export const UseIt = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  // accounts[0] deployed the contract, so it's the creator (the only one who
  // can claim); the next three are the contributors who pay into the pool.
  // Memoised on `world` so they keep a stable identity across renders —
  // otherwise the fresh array each render would re-arm refresh's effect and
  // spin an infinite read loop.
  const creator = world.accounts[0];
  const funders = useMemo(() => world.accounts.slice(1, 4), [world]);

  const [goal, setGoal] = useState<bigint | null>(null);
  const [deadline, setDeadline] = useState<bigint | null>(null);
  const [now, setNow] = useState<bigint | null>(null);
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);
  const [pool, setPool] = useState<bigint>(0n);
  const [wallets, setWallets] = useState<Record<Account, bigint>>({});
  const [ledger, setLedger] = useState<Record<Account, bigint>>({});
  const [claimed, setClaimed] = useState(false);
  const [refunded, setRefunded] = useState<Set<Account>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const roster = [creator, ...funders];
    const [goalV, deadlineV, block, poolBal] = await Promise.all([
      world.read(crowdfund, "GOAL") as Promise<bigint>,
      world.read(crowdfund, "deadline") as Promise<bigint>,
      world.client.getBlock(),
      world.client.getBalance({ address: crowdfund.address }),
    ]);
    const balances = await Promise.all(roster.map(a => world.client.getBalance({ address: a })));
    const contributions = await Promise.all(
      funders.map(a => world.read(crowdfund, "contributions", [a]) as Promise<bigint>),
    );
    setGoal(goalV);
    setDeadline(deadlineV);
    setNow(block.timestamp);
    setBlockNumber(block.number);
    setPool(poolBal);
    setWallets(Object.fromEntries(roster.map((a, i) => [a, balances[i]])) as Record<Account, bigint>);
    setLedger(Object.fromEntries(funders.map((a, i) => [a, contributions[i]])) as Record<Account, bigint>);
  }, [world, crowdfund, creator, funders]);

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message));
  }, [refresh]);

  // Runs a write keyed by `tag` (so only the clicked button spins), surfaces a
  // revert on screen instead of throwing, then re-reads the world.
  const run = async (tag: string, action: () => Promise<{ errors?: { message?: string; name?: string }[] }>) => {
    setBusy(tag);
    setError(null);
    try {
      const result = await action();
      const fail = result.errors?.[0];
      if (fail) {
        setError(fail.message ?? fail.name ?? "transaction reverted");
        return;
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const fund = (from: Account) =>
    run(`fund:${from}`, () => world.write(crowdfund, "fund", { from, value: FUND_AMOUNT }));
  const refund = (from: Account) =>
    run(`refund:${from}`, async () => {
      const result = await world.write(crowdfund, "refund", { from });
      if (!result.errors?.length) setRefunded(prev => new Set(prev).add(from));
      return result;
    });
  const claim = () =>
    run("claim", async () => {
      const result = await world.write(crowdfund, "claim", { from: creator });
      if (!result.errors?.length) setClaimed(true);
      return result;
    });

  // No increaseTime in this tevm — the only way to move the clock is to mine.
  // Each mine adds its interval to the current chain time, so a fixed step
  // marches time forward block by block. Two blocks per call because the
  // interval is the gap *between* mined blocks; one alone wouldn't apply it.
  const mineForward = (intervalS: bigint) =>
    run("clock", async () => {
      const mine = world.client.tevmMine as unknown as (p: { blockCount: number; interval: number }) => Promise<void>;
      await mine({ blockCount: 2, interval: Number(intervalS) });
      return {};
    });
  const step = () => mineForward(STEP_S);
  const skipToDeadline = () => {
    if (deadline !== null && now !== null) mineForward(deadline - now + ONE_DAY_S);
  };

  if (goal === null || deadline === null || now === null) {
    return (
      <div className="rounded-box bg-base-200 px-5 py-8 flex justify-center">
        <span className="loading loading-dots loading-md" />
      </div>
    );
  }

  const closed = now >= deadline;
  const goalMet = pool >= goal;
  const revert = explainRevert(error);
  const phase = phaseFor(claimed, closed, goalMet);
  const pct = goal === 0n ? 0 : Math.min(100, Number((pool * 100n) / goal));
  // window elapsed, for the clock bar: deploy time is deadline minus the window.
  const elapsed = now - (deadline - FUNDING_WINDOW_S);
  const timePct = Math.min(100, Math.max(0, Number((elapsed * 100n) / FUNDING_WINDOW_S)));
  // the chain clock, read straight off block.timestamp, made human
  const daysLeft = Math.max(0, Math.ceil(Number(deadline - now) / Number(ONE_DAY_S)));
  const chainDate = new Date(Number(now) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className={`alert alert-${phase.tone} items-start text-sm`}>
        <phase.icon className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-semibold">{phase.label}.</span> <span className="opacity-90">{phase.note}</span>
        </div>
      </div>

      {/* the pool — the hero. ETH piles up in the contract itself, addressable
          by anyone, controlled by no one. */}
      <div className="rounded-box bg-base-200 px-5 py-6 flex flex-col items-center gap-4">
        <SectionLabel icon={BuildingLibraryIcon}>the escrow pool</SectionLabel>
        {/* radial-progress only paints the filled arc, so a faint full ring
            sits underneath as the empty vessel — the gauge reads as a tank
            even at zero. */}
        <div className="relative grid place-items-center">
          <div className="radial-progress text-base-300" style={ringStyle(100)} aria-hidden />
          <div
            className={`radial-progress absolute inset-0 m-auto ${goalMet ? "text-success" : "text-primary"} ${busy?.startsWith("fund") ? "animate-pulse-fast" : ""}`}
            style={ringStyle(pct)}
            role="progressbar"
          >
            <div className="flex flex-col items-center leading-none">
              <span className="text-2xl font-mono tabular-nums text-base-content">{eth(pool)}</span>
              <span className="text-xs text-base-content/50 mt-1">/ {eth(goal)} ETH</span>
            </div>
          </div>
        </div>
        <Address address={crowdfund.address} disableAddressLink size="sm" />
        <p className="text-xs text-base-content/60 text-center max-w-xs m-0">
          That address holds the ETH directly. Not a wallet, not a company — the contract is the escrow.
        </p>
      </div>

      {/* the chain clock — mining is the only way time moves, so the student
          cranks it forward block by block and watches the deadline approach.
          The block number and date are read straight off the chain. */}
      <div className="rounded-box bg-base-200 px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionLabel icon={ClockIcon}>the chain clock</SectionLabel>
          <span className={`badge badge-sm ${closed ? "badge-warning" : "badge-success"} badge-outline font-mono`}>
            {closed ? "deadline passed" : `deadline in ${daysLeft}d`}
          </span>
        </div>

        {/* real on-chain values — both climb every time blocks get mined */}
        <div className="flex items-center gap-8 font-mono">
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wider text-base-content/40">block</span>
            <span className="text-lg tabular-nums">#{blockNumber?.toString() ?? "…"}</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs uppercase tracking-wider text-base-content/40">block.timestamp</span>
            <span className="text-lg tabular-nums">{chainDate}</span>
          </div>
        </div>

        <progress
          className={`progress ${closed ? "progress-warning" : "progress-success"} w-full`}
          value={timePct}
          max={100}
        />

        {!closed && (
          <div className="flex items-center gap-3 flex-wrap">
            <ActionButton busy={busy} tag="clock" icon={ForwardIcon} onClick={step} className="btn-outline">
              Mine ~2 days of blocks
            </ActionButton>
            <button
              className="btn btn-ghost btn-xs text-base-content/50"
              onClick={skipToDeadline}
              disabled={busy !== null}
            >
              skip to the deadline
            </button>
          </div>
        )}
      </div>

      {/* the accounts — the actors. Each row is a real address with a real
          balance, and the action it's allowed depends on the phase above. */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel icon={ArrowDownIcon}>
          accounts · every fund() sends ETH straight into the pool, no middleman
        </SectionLabel>

        <AccountRow
          badge={
            <span className="badge badge-primary badge-sm gap-1 font-mono shrink-0">
              <KeyIcon className="w-3 h-3" />
              creator
            </span>
          }
          address={creator}
          detail={`wallet ${eth(wallets[creator] ?? 0n)} ETH`}
          action={
            closed && goalMet && !claimed ? (
              <ActionButton busy={busy} tag="claim" icon={TrophyIcon} onClick={claim} className="btn-success">
                Claim {eth(pool)} ETH
              </ActionButton>
            ) : (
              <span className="text-xs font-mono text-base-content/40">
                {claimed ? "claimed ✓" : "waiting on the deal"}
              </span>
            )
          }
        />

        {funders.map((addr, i) => {
          const contribution = ledger[addr] ?? 0n;
          return (
            <AccountRow
              key={addr}
              badge={<span className="badge badge-ghost badge-sm font-mono shrink-0">#{i + 1}</span>}
              address={addr}
              detail={`in pool ${eth(contribution)} ETH · wallet ${eth(wallets[addr] ?? 0n)} ETH`}
              action={
                !closed ? (
                  <ActionButton
                    busy={busy}
                    tag={`fund:${addr}`}
                    icon={ArrowDownIcon}
                    onClick={() => fund(addr)}
                    className="btn-outline"
                  >
                    Fund 2 ETH
                  </ActionButton>
                ) : contribution > 0n ? (
                  // Shown after the deadline whether or not it can succeed — if the
                  // goal was hit (or the pool's been claimed) the contract reverts
                  // and the card below turns that into the lesson.
                  <ActionButton
                    busy={busy}
                    tag={`refund:${addr}`}
                    icon={ArrowUturnLeftIcon}
                    onClick={() => refund(addr)}
                    className="btn-error btn-outline"
                  >
                    Refund {eth(contribution)} ETH
                  </ActionButton>
                ) : (
                  <span className="text-xs font-mono text-base-content/40">
                    {refunded.has(addr) ? "refunded ✓" : "nothing in"}
                  </span>
                )
              }
            />
          );
        })}
      </div>

      <p className="text-sm text-base-content/70 m-0">
        Nobody in this picture trusts anybody. The pool answers to its own code, the clock is the only referee, and the
        same rules apply to the creator and the contributors alike.
      </p>
      {/* a reverted action isn't an error to hide — it's the contract doing its
          job. Name the rule, show the exact require() that fired, and frame it
          as the deal overruling the button. */}
      {revert ? (
        <div className="rounded-box border border-primary/30 bg-primary/5 px-4 py-3 flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="m-0 text-sm font-semibold">The contract enforced the rule, not the button.</p>
            <p className="m-0 text-sm text-base-content/80">{revert.lesson}</p>
            {revert.line && (
              <code className="block rounded bg-base-300/60 px-2 py-1 font-mono text-xs text-error/80 break-all">
                {revert.line}
              </code>
            )}
            <p className="m-0 font-mono text-xs text-base-content/40">reverted with “{revert.reason}”</p>
          </div>
        </div>
      ) : (
        error && <span className="text-xs text-error font-mono break-all">{error}</span>
      )}
    </div>
  );
};
