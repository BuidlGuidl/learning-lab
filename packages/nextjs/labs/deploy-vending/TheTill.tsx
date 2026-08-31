"use client";

// The ownership rules at work, as a three-step guided beat: a customer buys so
// the till has money in it, a stranger tries to empty it, the owner empties it.
import { useCallback, useEffect, useState } from "react";
import { PRICE_WEI } from "./deploy";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { BanknotesIcon, HandRaisedIcon, KeyIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import type { World } from "~~/lib/lab/harness";

type Props = { world: World };

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
  icon: typeof KeyIcon;
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

export const TheTill = ({ world }: Props) => {
  const machine = world.contracts.VendingMachine;
  const owner = world.accounts[0];
  const customer = world.accounts[1];

  const [till, setTill] = useState<bigint>(0n);
  const [bought, setBought] = useState(false);
  const [triedSteal, setTriedSteal] = useState(false);
  const [stealReason, setStealReason] = useState<string | null>(null);
  const [collected, setCollected] = useState<bigint | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setTill(await world.client.getBalance({ address: machine.address }));
  }, [world, machine]);

  useEffect(() => {
    refresh().catch(() => undefined);
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

  const buy = () =>
    run("buy", async () => {
      const result = await world.write(machine, "buy", { from: customer, value: PRICE_WEI });
      if (result.errors?.length) throw new Error(result.errors[0].message);
      setBought(true);
    });

  const steal = () =>
    run("steal", async () => {
      const result = await world.write(machine, "withdraw", { from: customer });
      const fail = result.errors?.[0];
      setTriedSteal(true);
      setStealReason(fail ? (fail.message ?? fail.name ?? null) : null);
    });

  const collect = () =>
    run("collect", async () => {
      const amount = till;
      const result = await world.write(machine, "withdraw", { from: owner });
      if (result.errors?.length) throw new Error(result.errors[0].message);
      setCollected(amount);
    });

  const step = !bought ? 1 : !triedSteal ? 2 : collected === null ? 3 : 4;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50">the till</span>
          <span className="font-mono text-2xl tabular-nums">{formatEther(till)} ETH</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-xs font-mono uppercase tracking-wider text-base-content/50 flex items-center gap-1">
            <KeyIcon className="w-3 h-3" /> owner (you)
          </span>
          <Address address={owner} disableAddressLink size="xs" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Step
          n={1}
          activeStep={step}
          busy={busy}
          icon={ShoppingCartIcon}
          text="First, put money in the till: have a customer buy a snack."
          action={buy}
          actionLabel="buy as customer"
          tag="buy"
          done={bought}
          doneNote="The customer bought a snack. 1 ETH sits in the till."
        />
        <Step
          n={2}
          activeStep={step}
          busy={busy}
          icon={HandRaisedIcon}
          text="Now the same customer tries to empty the till."
          action={steal}
          actionLabel="withdraw as customer"
          tag="steal"
          done={triedSteal}
          doneNote={
            stealReason
              ? "Refused. The contract checked msg.sender against owner and turned the customer away."
              : "That went through, which means your owner check is missing. Check your withdraw() lines."
          }
        />
        <Step
          n={3}
          activeStep={step}
          busy={busy}
          icon={BanknotesIcon}
          text="Finally, empty it yourself, as the owner."
          action={collect}
          actionLabel="withdraw as owner"
          tag="collect"
          done={collected !== null}
          doneNote={`You collected ${formatEther(collected ?? 0n)} ETH. The till is empty and the machine keeps selling.`}
        />
      </div>

      {triedSteal && stealReason && (
        <div className="rounded-box border px-4 py-3 flex flex-col gap-1.5">
          <p className="m-0 text-sm font-semibold">One line stood between the till and the stranger.</p>
          <code className="block break-all font-mono text-xs">
            require(msg.sender == owner, &quot;only the owner&quot;);
          </code>
          <p className="m-0 font-mono text-xs text-base-content/40">reverted with &ldquo;only the owner&rdquo;</p>
        </div>
      )}

      {error && <span className="text-xs text-lab-error font-mono break-all">{error}</span>}
    </div>
  );
};
