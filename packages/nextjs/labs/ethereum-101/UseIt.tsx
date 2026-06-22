"use client";

// The contract as an app: fund the pool from three accounts, mine the chain past
// the deadline, then settle. Every button is a real tx against the learner's code.
// This tevm rejects increaseTime/setNextBlockTimestamp, so time only moves by
// mining blocks — the trick tests.ts uses to land past the deadline.
import {
  type CSSProperties,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FUNDING_WINDOW_S } from "./deploy";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import {
  ArrowUturnLeftIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  ClockIcon,
  ForwardIcon,
  KeyIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { Address as Account, World } from "~~/lib/lab/harness";

type Props = { world: World };

const ONE_DAY_S = 24n * 60n * 60n;
// chain time per mine click — ~4 clicks crosses the 7-day window
const STEP_S = 2n * ONE_DAY_S;
// fixed contribution per send — three funders × 4 clears the 10 ETH goal
const FUND_AMOUNT = 4n * 10n ** 18n;
// guide prompts for the three funder sends, in order
const FUND_STEPS = ["Let's send 4 ETH into the pool", "Let's send another 4 ETH in", "One more — let's fill the pool"];

// A reverted write comes back as viem's verbose RevertError. Pull the human reason
// out and pair it with the require() line that fired — keyed by each require's
// revert string in Crowdfund.sol.
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

// The phase banner, one branch per deal state. `accent` colours the icon + label:
// mint for the good outcomes, peach for the short one, violet while still live.
const MINT = "text-lab-mint";
const PEACH = "text-peach-deep dark:text-peach-bright";
const VIOLET = "text-lab-violet";
type Phase = { accent: string; icon: ComponentType<{ className?: string }>; label: string; note: string };
const phaseFor = (claimed: boolean, closed: boolean, goalMet: boolean): Phase => {
  if (claimed)
    return {
      accent: MINT,
      icon: CheckBadgeIcon,
      label: "Settled",
      note: "the creator swept the pool. Code released the funds — no escrow agent had to sign off.",
    };
  if (closed && goalMet)
    return {
      accent: MINT,
      icon: TrophyIcon,
      label: "Deadline passed · goal hit",
      note: "the deal flips: refunds are off, the creator can claim the whole pool.",
    };
  if (closed)
    return {
      accent: PEACH,
      icon: LockClosedIcon,
      label: "Deadline passed · came up short",
      note: "no claim for anyone. Every contributor can pull their own ETH back out.",
    };
  if (goalMet)
    return {
      accent: MINT,
      icon: CheckBadgeIcon,
      label: "Goal reached",
      note: "the target's hit — advance the clock past the deadline so the creator can claim.",
    };
  return {
    accent: VIOLET,
    icon: BuildingLibraryIcon,
    label: "Funding open",
    note: "contributors can still pay in, and the deadline has time left on it.",
  };
};

// Pill button that spins on its own `tag` and locks out while any write runs.
// `active` marks the one button the guided flow wants next (filled, pinged,
// tooltip open); active={false} locks the rest of its sequence.
const ActionButton = ({
  busy,
  tag,
  icon: Icon,
  onClick,
  className,
  disabled,
  active,
  tip,
  tipClass,
  children,
}: {
  busy: string | null;
  tag: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  active?: boolean;
  tip?: string;
  tipClass?: string;
  children: ReactNode;
}) => {
  const button = (
    <span className="relative inline-flex">
      {/* corner ping marking the live button */}
      {active && (
        <span className="absolute -right-1 -top-1 z-10 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lab-mint opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-lab-mint ring-2 ring-lab-surface" />
        </span>
      )}
      <button
        className={`btn btn-sm gap-2 ${active ? "btn-primary" : (className ?? "")}`}
        onClick={onClick}
        disabled={busy !== null || disabled || active === false}
      >
        {busy === tag ? <span className="loading loading-spinner loading-xs" /> : <Icon className="w-4 h-4" />}
        {children}
      </button>
    </span>
  );
  if (!tip) return button;
  // active buttons open the tooltip by default; the rest reveal on hover. --tt-bg
  // is set explicitly because daisyUI's default inherits --color-primary.
  return (
    <span
      className={`tooltip ${active ? "tooltip-open" : ""} ${tipClass ?? "tooltip-left"} [--tt-bg:var(--color-violet-bright-strong)] before:text-[var(--color-deep-iris)] dark:[--tt-bg:var(--color-deep-iris)] dark:before:text-white`}
      data-tip={tip}
    >
      {button}
    </span>
  );
};

const SectionLabel = ({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) => (
  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-base-content/50">
    <Icon className="w-4 h-4" />
    {children}
  </div>
);

// true for ~0.8s after `value` changes — drives the balance-move highlights
const useChanged = (value: bigint) => {
  const [moved, setMoved] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setMoved(true);
    const t = setTimeout(() => setMoved(false), 800);
    return () => clearTimeout(t);
  }, [value]);
  return moved;
};

// rolls the displayed ETH amount toward `value` over ~0.8s — an odometer effect
const useCountUp = (value: bigint) => {
  const target = Number(formatEther(value));
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / 800);
      setShown(from + (target - from) * (1 - (1 - t) ** 2));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
};

// Rolls its figure to the new value and flashes it (scale + mint) on every change.
const LiveBalance = ({ value, className }: { value: bigint; className?: string }) => {
  const moved = useChanged(value);
  const shown = useCountUp(value);
  return (
    <span
      className={`mx-0.5 inline-block transition-all duration-300 ${className ?? ""} ${moved ? "scale-110 font-semibold text-lab-mint!" : ""}`}
    >
      {shown.toLocaleString("en-US", { maximumFractionDigits: 0 })}
    </span>
  );
};

// One account: a blockie + a mono detail line, with whatever action the phase
// allows it. The creator and the contributors share this shell.
const AccountRow = ({
  badge,
  address,
  detail,
  action,
  balance,
}: {
  badge: ReactNode;
  address: Account;
  detail: ReactNode;
  action: ReactNode;
  balance: bigint;
}) => {
  const moved = useChanged(balance);
  return (
    <div
      className={`rounded-box px-4 py-3 flex items-center justify-between gap-3 flex-wrap transition-colors duration-300 ${moved ? "bg-lab-mint/20!" : ""}`}
    >
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
};

export const UseIt = ({ world }: Props) => {
  const crowdfund = world.contracts.Crowdfund;
  // accounts[0] is the creator (only one who can claim); the next three contribute.
  // Memoised so the array keeps a stable identity — a fresh one each render would
  // re-arm refresh's effect into an infinite read loop.
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
    // every read is independent, so fire them in one batch instead of waterfalling
    const [goalV, deadlineV, block, poolBal, balances, contributions] = await Promise.all([
      world.read(crowdfund, "GOAL") as Promise<bigint>,
      world.read(crowdfund, "deadline") as Promise<bigint>,
      world.client.getBlock(),
      world.client.getBalance({ address: crowdfund.address }),
      Promise.all(roster.map(a => world.client.getBalance({ address: a }))),
      Promise.all(funders.map(a => world.read(crowdfund, "contributions", [a]) as Promise<bigint>)),
    ]);
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

  // Each mine adds its interval to the chain clock. Two blocks per call because
  // the interval is the gap *between* mined blocks; one alone wouldn't apply it.
  const mineForward = (intervalS: bigint) =>
    run("clock", async () => {
      const mine = world.client.tevmMine as unknown as (p: { blockCount: number; interval: number }) => Promise<void>;
      await mine({ blockCount: 2, interval: Number(intervalS) });
      return {};
    });
  const step = () => mineForward(STEP_S);

  if (goal === null || deadline === null || now === null) {
    return (
      <div className="rounded-box px-5 py-8 flex justify-center">
        <span className="loading loading-dots loading-md text-lab-violet" />
      </div>
    );
  }

  const closed = now >= deadline;
  const goalMet = pool >= goal;
  const revert = explainRevert(error);
  const phase = phaseFor(claimed, closed, goalMet);
  // the next guided step, derived from state: first unfunded funder, then mining,
  // then the claim — only that button lights up and stays enabled.
  const nextFunder = closed ? undefined : funders.find(a => (ledger[a] ?? 0n) === 0n);
  const allFunded = !closed && !nextFunder;
  // the banner's live instruction; falls back to the phase note when the guided
  // path runs out (claimed, or a short campaign)
  const stepNote = nextFunder
    ? `send 4 ETH from account #${funders.indexOf(nextFunder) + 1} into the pool.`
    : allFunded
      ? "the pool's full — mine blocks to push the clock past the deadline."
      : closed && goalMet && !claimed
        ? "the deadline passed — the creator can now claim the whole pool."
        : null;
  const bannerNote = stepNote ?? phase.note;
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
    <div className="flex flex-col gap-4">
      <div className="rounded-box border flex items-start gap-3 px-4 py-3 text-sm">
        <phase.icon className={`w-5 h-5 shrink-0 ${phase.accent}`} />
        <div>
          <span className={`font-semibold ${phase.accent}`}>{phase.label}.</span>{" "}
          <span className="text-base-content/70">{bannerNote}</span>
        </div>
      </div>

      {/* the pool and the clock, side by side */}
      <div className="rounded-box grid gap-5 px-5 py-5 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <SectionLabel icon={BuildingLibraryIcon}>the escrow pool</SectionLabel>
          {/* faint full ring under the filled arc, so the gauge reads even at zero */}
          <div className="relative grid place-items-center">
            <div
              className="radial-progress text-lab-track"
              style={{ "--value": 100, "--size": "7rem", "--thickness": "0.6rem" } as CSSProperties}
              aria-hidden
            />
            <div
              className={`radial-progress absolute inset-0 m-auto transition-colors duration-500 ${goalMet ? "text-lab-mint" : "text-lab-violet"} ${busy?.startsWith("fund") ? "animate-pulse-fast" : ""}`}
              style={{ "--value": pct, "--size": "7rem", "--thickness": "0.6rem" } as CSSProperties}
              role="progressbar"
            >
              <div className="flex flex-col items-center leading-none">
                <LiveBalance value={pool} className="font-mono text-xl tabular-nums text-lab-text" />
                <span className="mt-1 text-xs text-base-content/50">/ {formatEther(goal)} ETH</span>
              </div>
            </div>
          </div>
          <Address address={crowdfund.address} disableAddressLink size="xs" />
        </div>

        {/* the deadline, read straight off block.timestamp. The countdown is the
            headline; the bar and block read fill in the detail underneath. */}
        <div className="flex flex-col gap-2 sm:border-l sm:border-lab-border-strong sm:pl-5">
          <SectionLabel icon={ClockIcon}>the deadline</SectionLabel>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-4xl tabular-nums leading-none ${closed ? "text-peach-deep dark:text-peach-bright" : "text-lab-text"}`}
            >
              {closed ? "passed" : daysLeft}
            </span>
            {!closed && <span className="text-sm text-base-content/50">day{daysLeft === 1 ? "" : "s"} left</span>}
          </div>
          {/* time elapsed across the window — a plain bar, since daisyUI's
              progress tints fall outside the lab palette */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-lab-track">
            <div
              className={`h-full ${closed ? "bg-peach-deep dark:bg-peach-bright" : "bg-lab-violet"}`}
              style={{ width: `${timePct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-base-content/50">
            <span>block #{blockNumber?.toString() ?? "…"}</span>
            <span>{chainDate}</span>
          </div>
          {allFunded && (
            <div className="mt-1">
              <ActionButton
                busy={busy}
                tag="clock"
                icon={ForwardIcon}
                onClick={step}
                active
                tipClass="tooltip-top"
                tip="Let's mine some blocks to pass the deadline"
              >
                Mine ~2 days
              </ActionButton>
            </div>
          )}
        </div>
      </div>

      {/* the accounts — the actors. Each row is a real address with a real
          balance, and the action it's allowed depends on the phase above. */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel icon={UsersIcon}>accounts</SectionLabel>

        <AccountRow
          badge={
            <span className="badge badge-sm gap-1 font-mono shrink-0">
              <KeyIcon className="w-3 h-3" />
              creator
            </span>
          }
          address={creator}
          balance={wallets[creator] ?? 0n}
          detail={
            <>
              wallet <LiveBalance value={wallets[creator] ?? 0n} /> ETH
            </>
          }
          action={
            closed && goalMet && !claimed ? (
              <ActionButton
                busy={busy}
                tag="claim"
                icon={TrophyIcon}
                onClick={claim}
                active
                tip="Now let's claim the whole pool"
              >
                Claim {formatEther(pool)} ETH
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
          const walletBal = wallets[addr] ?? 0n;
          return (
            <AccountRow
              key={addr}
              badge={<span className="badge badge-ghost badge-sm font-mono shrink-0">#{i + 1}</span>}
              address={addr}
              balance={walletBal}
              detail={
                <>
                  {contribution > 0n && (
                    <>
                      in pool <LiveBalance value={contribution} /> ETH ·{" "}
                    </>
                  )}
                  wallet <LiveBalance value={walletBal} /> ETH
                </>
              }
              action={
                !closed ? (
                  contribution > 0n ? (
                    <span className="text-xs font-mono text-lab-mint">funded ✓</span>
                  ) : (
                    // only the next funder's button is lit + enabled
                    <ActionButton
                      busy={busy}
                      tag={`fund:${addr}`}
                      icon={PaperAirplaneIcon}
                      onClick={() => fund(addr)}
                      className="btn-outline"
                      active={addr === nextFunder}
                      tip={FUND_STEPS[i] ?? "Send 4 ETH into the pool"}
                    >
                      send 4 ETH
                    </ActionButton>
                  )
                ) : contribution > 0n ? (
                  // shown after the deadline even when it'll revert — the card
                  // below turns that revert into the lesson
                  <ActionButton
                    busy={busy}
                    tag={`refund:${addr}`}
                    icon={ArrowUturnLeftIcon}
                    onClick={() => refund(addr)}
                    className="btn-outline border-peach-deep text-peach-deep hover:bg-peach-deep hover:text-white dark:border-peach-bright dark:text-peach-bright dark:hover:bg-peach-bright dark:hover:text-lab-canvas"
                    tip="Pull this contribution back out"
                  >
                    Refund {formatEther(contribution)} ETH
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

      {/* a reverted action isn't an error to hide — it's the contract doing its
          job. Name the rule, show the exact require() that fired, and frame it
          as the deal overruling the button. */}
      {revert ? (
        <div className="rounded-box border px-4 py-3 flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-lab-violet shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="m-0 text-sm font-semibold">The contract enforced the rule, not the button.</p>
            <p className="m-0 text-sm text-base-content/80">{revert.lesson}</p>
            {revert.line && <code className="block break-all font-mono text-xs">{revert.line}</code>}
            <p className="m-0 font-mono text-xs text-base-content/40">reverted with “{revert.reason}”</p>
          </div>
        </div>
      ) : (
        error && <span className="text-xs text-lab-error font-mono break-all">{error}</span>
      )}
    </div>
  );
};
