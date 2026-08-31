"use client";

// Attack your own rules: pay wrong, pay right, buy the machine empty. Every
// button is a real transaction against the learner's guards, and a revert is
// framed as the rule they wrote doing its job.
import { useCallback, useEffect, useState } from "react";
import { PRICE_WEI } from "./deploy";
import { formatEther } from "viem";
import { ExclamationTriangleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import type { World } from "~~/lib/lab/harness";

type Props = { world: World };

// keyed by the exact reason strings the exercise asked for
const REVERTS: Record<string, { line: string; lesson: string }> = {
  "wrong coin": {
    line: 'require(msg.value == PRICE, "wrong coin");',
    lesson:
      "Your first rule fired. The machine takes exactly the price, nothing less and nothing more, and the whole transaction rolled back as if it never ran. The buyer keeps their ETH, minus the gas: the network still ran your rule, and running rules is work.",
  },
  "sold out": {
    line: 'require(stock > 0, "sold out");',
    lesson:
      "Your second rule fired. The shelf is empty, so the machine refuses the coin instead of taking money it can't honour. The buyer's ETH bounced back with the revert; the gas for the attempt did not.",
  },
};

const explainRevert = (raw: string | null) => {
  if (!raw) return null;
  for (const reason of Object.keys(REVERTS)) {
    if (raw.includes(reason)) return { reason, ...REVERTS[reason] };
  }
  return { reason: raw, line: "", lesson: "The contract checked its rules and said no. The transaction rolled back." };
};

type Outcome = { kind: "sale"; stockLeft: bigint } | { kind: "revert"; raw: string } | null;

export const BreakIt = ({ world }: Props) => {
  const machine = world.contracts.VendingMachine;
  const buyer = world.accounts[1];

  const [stock, setStock] = useState<bigint | null>(null);
  const [till, setTill] = useState<bigint>(0n);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStock((await world.read(machine, "stock")) as bigint);
    setTill(await world.client.getBalance({ address: machine.address }));
  }, [world, machine]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const tryBuy = async (tag: string, value: bigint) => {
    setBusy(tag);
    try {
      const result = await world.write(machine, "buy", { from: buyer, value });
      const fail = result.errors?.[0];
      if (fail) {
        setOutcome({ kind: "revert", raw: fail.message ?? fail.name ?? "reverted" });
      } else {
        const stockLeft = (await world.read(machine, "stock")) as bigint;
        setOutcome({ kind: "sale", stockLeft });
      }
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const revert = outcome?.kind === "revert" ? explainRevert(outcome.raw) : null;
  const soldOut = stock !== null && stock === 0n;

  const attack = (tag: string, label: string, value: bigint, hint: string) => (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-sm text-base-content/70">{hint}</span>
      <button
        className="btn btn-outline btn-sm gap-2 shrink-0"
        onClick={() => tryBuy(tag, value)}
        disabled={busy !== null}
      >
        {busy === tag && <span className="loading loading-spinner loading-xs" />}
        {label}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the shelf</span>
          <span className="font-mono text-2xl tabular-nums" aria-label={`${stock ?? "…"} snacks left`}>
            {stock === null ? "…" : "🥨".repeat(Number(stock)) || "empty"}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the till</span>
          <span className="font-mono text-2xl tabular-nums">{formatEther(till)} ETH</span>
        </div>
      </div>

      <div className="rounded-box px-5 py-4 flex flex-col gap-3">
        {attack("under", "pay 0.5 ETH", PRICE_WEI / 2n, "Feed it half a coin.")}
        {attack("over", "pay 2 ETH", PRICE_WEI * 2n, "Overpay it. Surely it takes more?")}
        {attack(
          "exact",
          "pay 1 ETH",
          PRICE_WEI,
          soldOut ? "Try the exact price on an empty machine." : "Now the exact price.",
        )}
      </div>

      {outcome?.kind === "sale" && (
        <div className="rounded-box border px-4 py-3 flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-lab-mint shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="m-0 text-sm font-semibold">Snack dropped. Both rules passed.</p>
            <p className="m-0 text-sm text-base-content/80">
              The coin was exact and the shelf had stock, so the sale ran and 1 ETH landed in the till.{" "}
              {outcome.stockLeft === 0n
                ? "That was the last one. Try buying again and watch your second rule take over."
                : `${outcome.stockLeft.toString()} left. Keep buying until it runs dry.`}
            </p>
          </div>
        </div>
      )}

      {revert && (
        <div className="rounded-box border px-4 py-3 flex gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-lab-violet shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="m-0 text-sm font-semibold">Refused. That was your rule, not an error.</p>
            <p className="m-0 text-sm text-base-content/80">{revert.lesson}</p>
            {revert.line && <code className="block break-all font-mono text-xs">{revert.line}</code>}
            <p className="m-0 font-mono text-xs text-base-content/40">reverted with &ldquo;{revert.reason}&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  );
};
