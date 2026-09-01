"use client";

// The finished machine as an app: three customers feed it coins, the shelf and
// the till move with every sale, the owner collects the takings and restocks.
// Every button is a real transaction against the learner's code.
import { useCallback, useEffect, useMemo, useState } from "react";
import { PRICE_WEI, STARTING_STOCK } from "./deploy";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  KeyIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { Address as Account, World } from "~~/lib/lab/harness";

type Props = { world: World };

// keyed by each require's revert string in VendingMachine.sol
const REVERTS: Record<string, { line: string; lesson: string }> = {
  "wrong coin": {
    line: 'require(msg.value == PRICE, "wrong coin");',
    lesson: "The machine takes exactly the price. Anything else bounces, coin and all.",
  },
  "sold out": {
    line: 'require(stock > 0, "sold out");',
    lesson:
      "The shelf is empty, so the machine refuses the coin instead of taking money for a snack it doesn't have. The owner can restock it.",
  },
  "only the owner": {
    line: 'require(msg.sender == owner, "only the owner");',
    lesson: "Only the account that deployed the machine can touch the till or the shelf. Everyone else is turned away.",
  },
  "nothing to withdraw": {
    line: 'require(amount > 0, "nothing to withdraw");',
    lesson: "The till is empty. Sell something first.",
  },
};

const explainRevert = (raw: string | null) => {
  if (!raw) return null;
  for (const reason of Object.keys(REVERTS)) {
    if (raw.includes(reason)) return { reason, ...REVERTS[reason] };
  }
  return null;
};

const wholeEth = (value: bigint) => Number(formatEther(value)).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const RunTheMachine = ({ world }: Props) => {
  const machine = world.contracts.VendingMachine;
  const owner = world.accounts[0];
  const customers = useMemo(() => world.accounts.slice(1, 4), [world]);

  const [stock, setStock] = useState<bigint | null>(null);
  const [till, setTill] = useState<bigint>(0n);
  const [wallets, setWallets] = useState<Record<Account, bigint>>({});
  const [receipts, setReceipts] = useState<Record<Account, bigint>>({});
  const [collected, setCollected] = useState<bigint>(0n);
  const [restocked, setRestocked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const roster = [owner, ...customers];
    const [stockV, tillV, balances, purchases] = await Promise.all([
      world.read(machine, "stock") as Promise<bigint>,
      world.client.getBalance({ address: machine.address }),
      Promise.all(roster.map(a => world.client.getBalance({ address: a }))),
      Promise.all(customers.map(a => world.read(machine, "purchases", [a]) as Promise<bigint>)),
    ]);
    setStock(stockV);
    setTill(tillV);
    setWallets(Object.fromEntries(roster.map((a, i) => [a, balances[i]])) as Record<Account, bigint>);
    setReceipts(Object.fromEntries(customers.map((a, i) => [a, purchases[i]])) as Record<Account, bigint>);
  }, [world, machine, owner, customers]);

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message));
  }, [refresh]);

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

  const buy = (from: Account) => run(`buy:${from}`, () => world.write(machine, "buy", { from, value: PRICE_WEI }));
  const withdraw = () =>
    run("withdraw", async () => {
      const amount = till;
      const result = await world.write(machine, "withdraw", { from: owner });
      if (!result.errors?.length) setCollected(prev => prev + amount);
      return result;
    });
  const restock = () =>
    run("restock", async () => {
      const result = await world.write(machine, "restock", { args: [STARTING_STOCK], from: owner });
      if (!result.errors?.length) setRestocked(true);
      return result;
    });

  if (stock === null) {
    return (
      <div className="rounded-box px-5 py-8 flex justify-center">
        <span className="loading loading-dots loading-md text-lab-violet" />
      </div>
    );
  }

  const soldOut = stock === 0n;
  const revert = explainRevert(error);
  // the guided path: get every customer a first snack, sell the shelf empty,
  // collect the takings, restock. After that the machine is theirs to play with.
  const nextCustomer = soldOut ? undefined : customers.find(a => (receipts[a] ?? 0n) === 0n);
  const banner = restocked
    ? {
        icon: CheckBadgeIcon,
        accent: "text-lab-mint",
        text: "Back in business. The machine is yours now; run it however you like.",
      }
    : soldOut && till > 0n
      ? { icon: BanknotesIcon, accent: "text-lab-mint", text: "Sold out, and the till is full. Collect the takings." }
      : soldOut
        ? {
            icon: ArchiveBoxIcon,
            accent: "text-lab-violet",
            text: "Till collected. Restock the shelf and the machine sells again.",
          }
        : nextCustomer
          ? {
              icon: ShoppingCartIcon,
              accent: "text-lab-violet",
              text: `Customer #${customers.indexOf(nextCustomer) + 1} is up. Insert a coin.`,
            }
          : {
              icon: ShoppingCartIcon,
              accent: "text-lab-violet",
              text: "Everyone's had one. Keep selling until the shelf is empty.",
            };
  const BannerIcon = banner.icon;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box border flex items-start gap-3 px-4 py-3 text-sm">
        <BannerIcon className={`w-5 h-5 shrink-0 ${banner.accent}`} />
        <span className="text-base-content/70">{banner.text}</span>
      </div>

      {/* the machine itself: shelf, till, price tag */}
      <div className="rounded-box grid gap-5 px-5 py-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the shelf</span>
          <span className="font-mono text-3xl tabular-nums" aria-label={`${stock} snacks left`}>
            {"🥨".repeat(Number(stock)) || "empty"}
          </span>
          <span className="text-xs font-mono text-base-content/50">
            {stock.toString()} in stock · {formatEther(PRICE_WEI)} ETH each
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:border-l sm:border-lab-border-strong sm:pl-5">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the till</span>
          <span className="font-mono text-3xl tabular-nums">{formatEther(till)} ETH</span>
          <Address address={machine.address} disableAddressLink size="xs" />
        </div>
      </div>

      {/* the actors */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-base-content/50">
          <UsersIcon className="w-4 h-4" />
          accounts
        </div>

        <div className="rounded-box px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="badge badge-sm gap-1 font-mono shrink-0">
              <KeyIcon className="w-3 h-3" />
              owner
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <Address address={owner} disableAddressLink size="sm" />
              <span className="text-xs font-mono text-base-content/50">
                wallet {wholeEth(wallets[owner] ?? 0n)} ETH
                {collected > 0n && <> · collected {formatEther(collected)} ETH</>}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className={`btn btn-sm gap-2 ${soldOut && till > 0n ? "btn-primary" : "btn-outline"}`}
              onClick={withdraw}
              disabled={busy !== null}
            >
              {busy === "withdraw" ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <BanknotesIcon className="w-4 h-4" />
              )}
              withdraw
            </button>
            <button
              className={`btn btn-sm gap-2 ${soldOut && till === 0n ? "btn-primary" : "btn-outline"}`}
              onClick={restock}
              disabled={busy !== null}
            >
              {busy === "restock" ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <ArchiveBoxIcon className="w-4 h-4" />
              )}
              restock +{STARTING_STOCK.toString()}
            </button>
          </div>
        </div>

        {customers.map((addr, i) => {
          const count = receipts[addr] ?? 0n;
          return (
            <div key={addr} className="rounded-box px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="badge badge-ghost badge-sm font-mono shrink-0">#{i + 1}</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <Address address={addr} disableAddressLink size="sm" />
                  <span className="text-xs font-mono text-base-content/50">
                    wallet {wholeEth(wallets[addr] ?? 0n)} ETH{count > 0n && <> · bought {count.toString()}</>}
                  </span>
                </div>
              </div>
              <button
                className={`btn btn-sm gap-2 ${addr === nextCustomer ? "btn-primary" : "btn-outline"}`}
                onClick={() => buy(addr)}
                disabled={busy !== null}
              >
                {busy === `buy:${addr}` ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <ShoppingCartIcon className="w-4 h-4" />
                )}
                insert 1 ETH
              </button>
            </div>
          );
        })}
      </div>

      {/* a revert is the machine enforcing the deal, so it gets a lesson, not an error state */}
      {revert ? (
        <div className="rounded-box border px-4 py-3 flex gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-lab-violet shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="m-0 text-sm font-semibold">The machine enforced the rule, not the button.</p>
            <p className="m-0 text-sm text-base-content/80">{revert.lesson}</p>
            <code className="block break-all font-mono text-xs">{revert.line}</code>
            <p className="m-0 font-mono text-xs text-base-content/40">reverted with &ldquo;{revert.reason}&rdquo;</p>
          </div>
        </div>
      ) : (
        error && <span className="text-xs text-lab-error font-mono break-all">{error}</span>
      )}
    </div>
  );
};
