"use client";

// Ownership from the outside: mint to Alice, let Bob try to take the token
// (the contract says no), have Alice approve him, then watch the same call
// succeed, and the approval get spent. Every button is a real transaction
// against the learner's contract; the reverts are the curriculum.
import { useCallback, useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import {
  ArrowsRightLeftIcon,
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { World } from "~~/lib/lab/harness";

type Props = { world: World };

const CID = "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr";
const ZERO = "0x0000000000000000000000000000000000000000";

// each guided step: the button label, who signs, and what it proves
type StepId = "mint" | "steal" | "approve" | "transfer" | "mint2" | "operator" | "marketTransfer";

export const TradeIt = ({ world }: Props) => {
  const collectible = world.contracts.YourCollectible;
  const alice = world.accounts[1];
  const bob = world.accounts[2];
  const market = world.accounts[3];

  const [owner, setOwner] = useState<string | null>(null);
  const [owner2, setOwner2] = useState<string | null>(null);
  const [approved, setApproved] = useState<string>(ZERO);
  const [operatorApproved, setOperatorApproved] = useState(false);
  const [stealTried, setStealTried] = useState(false);
  const [busy, setBusy] = useState<StepId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [who, appr] = await Promise.all([
        world.read(collectible, "ownerOf", [1n]) as Promise<string>,
        world.read(collectible, "getApproved", [1n]) as Promise<string>,
      ]);
      setOwner(who);
      setApproved(appr);
    } catch {
      setOwner(null); // token 1 not minted yet; ownerOf reverts
      setApproved(ZERO);
    }

    try {
      setOwner2((await world.read(collectible, "ownerOf", [2n])) as string);
    } catch {
      setOwner2(null); // token 2 not minted yet
    }

    try {
      setOperatorApproved((await world.read(collectible, "isApprovedForAll", [alice, market])) as boolean);
    } catch {
      setOperatorApproved(false);
    }
  }, [world, collectible, alice, market]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (tag: StepId, action: () => Promise<{ errors?: { message?: string; name?: string }[] }>) => {
    setBusy(tag);
    setError(null);
    try {
      const result = await action();
      const fail = result.errors?.[0];
      if (fail) {
        setError(fail.message ?? fail.name ?? "transaction reverted");
        if (tag === "steal") setStealTried(true);
        return;
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const mint = () => run("mint", () => world.write(collectible, "mintItem", { args: [alice, CID], from: alice }));
  const steal = () =>
    run("steal", () => world.write(collectible, "transferFrom", { args: [alice, bob, 1n], from: bob }));
  const approve = () => run("approve", () => world.write(collectible, "approve", { args: [bob, 1n], from: alice }));
  const transfer = () =>
    run("transfer", () => world.write(collectible, "transferFrom", { args: [alice, bob, 1n], from: bob }));
  const mintSecond = () =>
    run("mint2", () => world.write(collectible, "mintItem", { args: [alice, CID], from: alice }));
  const approveOperator = () =>
    run("operator", () => world.write(collectible, "setApprovalForAll", { args: [market, true], from: alice }));
  const marketTransfer = () =>
    run("marketTransfer", () => world.write(collectible, "transferFrom", { args: [alice, bob, 2n], from: market }));

  const aliceOwns = owner?.toLowerCase() === alice.toLowerCase();
  const bobOwns = owner?.toLowerCase() === bob.toLowerCase();
  const aliceOwns2 = owner2?.toLowerCase() === alice.toLowerCase();
  const bobOwns2 = owner2?.toLowerCase() === bob.toLowerCase();
  const bobApproved = approved.toLowerCase() === bob.toLowerCase();
  const rejected = error !== null && /ERC721InsufficientApproval|revert/i.test(error);

  // the one step the guided flow wants next
  const step: StepId | null = !owner
    ? "mint"
    : !stealTried
      ? "steal"
      : bobOwns
        ? null
        : !bobApproved
          ? "approve"
          : "transfer";

  const steps: {
    id: StepId;
    icon: typeof SparklesIcon;
    label: string;
    caption: string;
    onClick: () => void;
    done: boolean;
  }[] = [
    {
      id: "mint",
      icon: SparklesIcon,
      label: "mint #1 to Alice",
      caption: "Alice signs, so she becomes ownerOf(1)",
      onClick: mint,
      done: !!owner,
    },
    {
      id: "steal",
      icon: HandRaisedIcon,
      label: "Bob: transferFrom(alice → bob, 1)",
      caption: "Bob signs, with no approval. Watch the contract answer.",
      onClick: steal,
      done: stealTried,
    },
    {
      id: "approve",
      icon: CheckBadgeIcon,
      label: "Alice: approve(bob, 1)",
      caption: "Alice grants Bob the right to move this one token",
      onClick: approve,
      done: bobApproved || bobOwns,
    },
    {
      id: "transfer",
      icon: ArrowsRightLeftIcon,
      label: "Bob: transferFrom again",
      caption: "the exact call that just failed",
      onClick: transfer,
      done: bobOwns,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* the ledger row everyone is fighting over */}
      <div className="rounded-box flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-col gap-1 font-mono text-sm">
          <span className="text-xs uppercase tracking-wider text-base-content/50">the on-chain record</span>
          <span>
            ownerOf(1) ={" "}
            {owner ? (
              <span className={bobOwns ? "text-lab-mint" : "text-lab-violet"}>
                {aliceOwns ? "alice" : bobOwns ? "bob" : owner}
              </span>
            ) : (
              <span className="text-base-content/40">no token yet</span>
            )}
          </span>
          <span>
            getApproved(1) ={" "}
            {bobApproved ? (
              <span className="text-lab-mint">bob</span>
            ) : (
              <span className="text-base-content/40">nobody</span>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 text-xs">
          <span className="flex items-center gap-2">
            <span className="badge badge-sm font-mono">alice</span>
            <Address address={alice} disableAddressLink size="xs" />
          </span>
          <span className="flex items-center gap-2">
            <span className="badge badge-ghost badge-sm font-mono">bob</span>
            <Address address={bob} disableAddressLink size="xs" />
          </span>
          <span className="flex items-center gap-2">
            <span className="badge badge-outline badge-sm font-mono">market</span>
            <Address address={market} disableAddressLink size="xs" />
          </span>
        </div>
      </div>

      {/* the guided sequence */}
      <div className="flex flex-col gap-2">
        {steps.map(s => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs ${step === s.id ? "text-base-content/80" : "text-base-content/45"}`}>
              {s.caption}
            </span>
            <span className="relative inline-flex">
              {step === s.id && (
                <span className="absolute -right-1 -top-1 z-10 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lab-mint opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-lab-mint ring-2 ring-lab-surface" />
                </span>
              )}
              <button
                className={`btn btn-sm gap-2 font-mono ${step === s.id ? "btn-primary" : "btn-outline"}`}
                onClick={s.onClick}
                disabled={busy !== null || s.done || (step !== s.id && !s.done)}
              >
                {busy === s.id ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
                {s.done ? `${s.label} ✓` : s.label}
              </button>
            </span>
          </div>
        ))}
      </div>

      {error &&
        (rejected ? (
          <div className="rounded-box flex gap-3 border px-4 py-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-lab-violet" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="m-0 text-sm font-semibold">The contract turned Bob away.</p>
              <p className="m-0 text-sm text-base-content/80">
                <code className="font-mono">transferFrom</code> checks that the caller is the owner, approved for this
                token, or an operator via <code className="font-mono">setApprovalForAll</code>. Bob is none of those, so
                the transfer reverts with <code className="font-mono">ERC721InsufficientApproval</code>. The contract
                enforces the transfer rule itself; an admin cannot edit a row to move the token.
              </p>
              <p className="m-0 break-all font-mono text-xs text-base-content/40">{error}</p>
            </div>
          </div>
        ) : (
          <span className="break-all font-mono text-xs text-lab-error">{error}</span>
        ))}

      {bobOwns && (
        <>
          <p className="m-0 text-sm text-base-content/70">
            Same call, opposite result: the only thing that changed is one approval. Notice{" "}
            <code className="font-mono">getApproved(1)</code> reset to nobody; a one-token approval is spent by the
            transfer it allowed.
          </p>

          <div className="rounded-box border px-4 py-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1 font-mono text-sm">
                <span className="text-xs uppercase tracking-wider text-base-content/50">operator approval</span>
                <span>
                  ownerOf(2) ={" "}
                  {owner2 ? (
                    <span className={bobOwns2 ? "text-lab-mint" : "text-lab-violet"}>
                      {aliceOwns2 ? "alice" : bobOwns2 ? "bob" : owner2}
                    </span>
                  ) : (
                    <span className="text-base-content/40">no token yet</span>
                  )}
                </span>
                <span>
                  isApprovedForAll(alice, market) ={" "}
                  <span className={operatorApproved ? "text-lab-mint" : "text-base-content/40"}>
                    {operatorApproved ? "true" : "false"}
                  </span>
                </span>
              </div>
              <BuildingStorefrontIcon className="h-6 w-6 text-lab-violet" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                className="btn btn-sm btn-outline justify-start gap-2 font-mono"
                onClick={mintSecond}
                disabled={busy !== null || !!owner2}
              >
                {busy === "mint2" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                Alice: mint #2
              </button>
              <button
                className="btn btn-sm btn-outline justify-start gap-2 font-mono"
                onClick={approveOperator}
                disabled={busy !== null || !aliceOwns2 || operatorApproved}
              >
                {busy === "operator" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <CheckBadgeIcon className="h-4 w-4" />
                )}
                Alice: setApprovalForAll(market, true)
              </button>
              <button
                className="btn btn-sm btn-outline justify-start gap-2 font-mono"
                onClick={marketTransfer}
                disabled={busy !== null || !aliceOwns2 || !operatorApproved || bobOwns2}
              >
                {busy === "marketTransfer" ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                )}
                Market: transferFrom(alice, bob, 2)
              </button>
            </div>

            {bobOwns2 && (
              <p className="m-0 mt-3 text-sm text-base-content/70">
                The marketplace never owned token #2. Alice kept custody until sale time, but the operator approval made
                the market a valid caller for <code className="font-mono">transferFrom</code>.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
