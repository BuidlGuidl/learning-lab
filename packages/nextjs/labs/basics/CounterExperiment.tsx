"use client";

// "Drive your counter" — the basics lab's capstone experiment (ADR-0018).
// The learner pokes at their own assembled Counter on a throwaway chain:
// increment from different accounts, set the number directly, and the hero
// beat — reset() as the owner (works) and as a stranger (real revert).
import { useCallback, useEffect, useState } from "react";
import { decodeEventLog } from "viem";
import type { Address, World } from "~~/lib/lab/harness";

type Props = { world: World };

type TxRow = {
  id: number;
  actor: string;
  badge: string;
  call: string;
  reverted: boolean;
  // the NumberChanged line on success, the revert reason on failure
  detail?: string;
};

const short = (a: Address) => `${a.slice(0, 6)}…${a.slice(-4)}`;

// tevm's revert message buries the reason under call details, docs links and
// version dumps; keep the sentence + custom error, drop the stack-dump noise
const revertReason = (message: string) => message.split(/\s+(?:Contract Call:|Docs:|Details:|Version:)/)[0];

// decode a write's logs against the contract's own abi; undecodable logs are skipped
const decodedEvents = (logs: { topics: `0x${string}`[]; data: `0x${string}` }[] | undefined, abi: unknown[]) =>
  (logs ?? []).flatMap(log => {
    try {
      return [decodeEventLog({ abi: abi as never, topics: log.topics as never, data: log.data })];
    } catch {
      return [];
    }
  });

export const CounterExperiment = ({ world }: Props) => {
  const counter = world.contracts.Counter;
  // accounts[0] deployed the contract in deploy.ts, so it's the owner —
  // the same cast the reset tests use
  const actors = [
    { label: "owner", address: world.accounts[0], badge: "badge-primary" },
    { label: "stranger A", address: world.accounts[1], badge: "badge-secondary" },
    { label: "stranger B", address: world.accounts[2], badge: "badge-accent" },
  ];
  const [owner, strangerA] = actors;

  const [number, setNumber] = useState<bigint | null>(null);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [setInput, setSetInput] = useState("");
  // one transaction in flight at a time, keyed by the button that sent it
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setNumber((await world.read(counter, "number")) as bigint);
  }, [world, counter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = async (key: string, actor: (typeof actors)[number], fn: string, args?: unknown[]) => {
    setBusy(key);
    try {
      const result = await world.write(counter, fn, { args, from: actor.address });
      const reverted = !!result.errors?.length;
      const detail = reverted
        ? revertReason(result.errors?.[0]?.message ?? result.errors?.[0]?.name ?? "reverted")
        : decodedEvents(result.logs, counter.abi)
            .map(e => `${e.eventName}(${Object.values(e.args ?? {}).join(", ")})`)
            .join(" ") || undefined;
      const call = `${fn}(${(args ?? []).join(", ")})`;
      setRows(prev => [
        { id: prev.length + 1, actor: actor.label, badge: actor.badge, call, reverted, detail },
        ...prev,
      ]);
      if (!reverted) await refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleSetNumber = () => {
    let value: bigint;
    try {
      value = BigInt(setInput.trim());
    } catch {
      return;
    }
    send("setNumber", strangerA, "setNumber", [value]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* live state readout */}
      <div className="rounded-box bg-base-200 px-5 py-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-base-content/50 mb-1">Counter.number</div>
          <div className="text-5xl font-mono tabular-nums leading-none">
            {number === null ? "–" : number.toString()}
          </div>
        </div>
        <div className="text-right text-xs font-mono text-base-content/40">
          <div>deployed at</div>
          <div>{short(counter.address)}</div>
        </div>
      </div>

      {/* increment — open to anyone */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content/70">
          <code className="font-mono">increment()</code> — anyone can call it
        </span>
        <div className="flex flex-wrap gap-2">
          {actors.map(actor => (
            <button
              key={actor.label}
              className="btn btn-sm btn-outline gap-2 normal-case font-mono"
              onClick={() => send(`increment:${actor.label}`, actor, "increment")}
              disabled={busy !== null}
            >
              {busy === `increment:${actor.label}` && <span className="loading loading-spinner loading-xs" />}
              as {actor.label}
            </button>
          ))}
        </div>
      </div>

      {/* setNumber — also open, fires the event */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content/70">
          <code className="font-mono">setNumber(uint256)</code> — also open, and it emits your event
        </span>
        <div className="join max-w-xs">
          <input
            className="input input-bordered input-sm join-item font-mono w-32"
            placeholder="7"
            inputMode="numeric"
            value={setInput}
            onChange={e => setSetInput(e.target.value)}
            disabled={busy !== null}
          />
          <button
            className="btn btn-sm join-item normal-case font-mono"
            onClick={handleSetNumber}
            disabled={busy !== null || setInput.trim() === ""}
          >
            {busy === "setNumber" && <span className="loading loading-spinner loading-xs" />}
            as {strangerA.label}
          </button>
        </div>
      </div>

      {/* reset — the onlyOwner beat */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content/70">
          <code className="font-mono">reset()</code> — <code className="font-mono">onlyOwner</code>. Try both.
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline gap-2 normal-case font-mono"
            onClick={() => send("reset:owner", owner, "reset")}
            disabled={busy !== null}
          >
            {busy === "reset:owner" && <span className="loading loading-spinner loading-xs" />}
            as owner
          </button>
          <button
            className="btn btn-sm btn-outline btn-error gap-2 normal-case font-mono"
            onClick={() => send("reset:stranger", strangerA, "reset")}
            disabled={busy !== null}
          >
            {busy === "reset:stranger" && <span className="loading loading-spinner loading-xs" />}
            as {strangerA.label}
          </button>
        </div>
      </div>

      {/* transaction tape, newest first */}
      <div className="rounded-box border border-base-300 overflow-hidden">
        <div className="px-3 py-2 bg-base-200 text-xs font-mono uppercase tracking-wider text-base-content/50">
          transactions
        </div>
        {rows.length === 0 ? (
          <p className="px-3 py-3 text-sm text-base-content/50 m-0">nothing yet — press a button above</p>
        ) : (
          rows.map(row => (
            <div
              key={row.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 font-mono text-xs border-t border-base-300 first:border-t-0"
            >
              <span className="text-base-content/40 tabular-nums">#{row.id}</span>
              <span className={`badge badge-xs ${row.badge}`}>{row.actor}</span>
              <span>{row.call}</span>
              <span className={row.reverted ? "text-error font-semibold" : "text-success"}>
                {row.reverted ? "reverted" : "mined"}
              </span>
              {row.detail && (
                <span className={`break-all ${row.reverted ? "text-error/70" : "text-base-content/60"}`}>
                  {row.detail}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
