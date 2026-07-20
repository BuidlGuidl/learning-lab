"use client";

// The mint, exercised against the learner's real contract. Three deliveries in
// a guided order: yourself (works), the NaiveVault (the contract refuses,
// that revert IS the lesson), the FriendlyGallery (a contract that passes the
// handshake). Every button is a real transaction against the learner's code.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Address } from "@scaffold-ui/components";
import {
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import type { Address as Account, World } from "~~/lib/lab/harness";

type Props = { world: World };

const CID = "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr";

export const MintIt = ({ world }: Props) => {
  const collectible = world.contracts.YourCollectible;
  const vault = world.contracts.NaiveVault;
  const gallery = world.contracts.FriendlyGallery;
  const me = world.accounts[1];

  const [counter, setCounter] = useState<bigint>(0n);
  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const [lastUri, setLastUri] = useState<string | null>(null);
  const [vaultRefused, setVaultRefused] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const holders = useMemo(
    () => [
      { key: "you", label: "you", address: me, icon: UserIcon, note: "a wallet; keys can move a token later" },
      { key: "vault", label: "NaiveVault", address: vault.address, icon: ArchiveBoxIcon, note: "no onERC721Received" },
      {
        key: "gallery",
        label: "FriendlyGallery",
        address: gallery.address,
        icon: BuildingStorefrontIcon,
        note: "implements the handshake",
      },
    ],
    [me, vault.address, gallery.address],
  );

  const refresh = useCallback(async () => {
    const [count, ...owned] = await Promise.all([
      world.read(collectible, "tokenIdCounter") as Promise<bigint>,
      ...holders.map(h => world.read(collectible, "balanceOf", [h.address]) as Promise<bigint>),
    ]);
    setCounter(count);
    setBalances(Object.fromEntries(holders.map((h, i) => [h.key, owned[i]])));
    setLastUri(count > 0n ? ((await world.read(collectible, "tokenURI", [count])) as string) : null);
  }, [world, collectible, holders]);

  useEffect(() => {
    refresh().catch(e => setError((e as Error).message));
  }, [refresh]);

  const mintTo = async (tag: string, to: Account) => {
    setBusy(tag);
    setError(null);
    try {
      const result = await world.write(collectible, "mintItem", { args: [to, CID], from: me });
      const fail = result.errors?.[0];
      if (fail) {
        setError(fail.message ?? fail.name ?? "transaction reverted");
        if (tag === "vault") setVaultRefused(true);
        return;
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const refused = error !== null && /ERC721InvalidReceiver|revert/i.test(error);
  // the guided order: yourself → the vault (refusal) → the gallery
  const step =
    (balances["you"] ?? 0n) === 0n
      ? "you"
      : !vaultRefused
        ? "vault"
        : (balances["gallery"] ?? 0n) === 0n
          ? "gallery"
          : null;

  const MintButton = ({ tag, to, active }: { tag: string; to: Account; active: boolean }) => (
    <span className="relative inline-flex">
      {active && (
        <span className="absolute -right-1 -top-1 z-10 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lab-mint opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-lab-mint ring-2 ring-lab-surface" />
        </span>
      )}
      <button
        className={`btn btn-sm gap-2 ${active ? "btn-primary" : "btn-outline"}`}
        onClick={() => mintTo(tag, to)}
        disabled={busy !== null}
      >
        {busy === tag ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <PaperAirplaneIcon className="h-4 w-4" />
        )}
        mintItem
      </button>
    </span>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-base-content/80">
        Same function, three receivers. Mint to yourself first, then try to mint straight into the{" "}
        <code className="font-mono">NaiveVault</code>.
      </p>

      <div className="flex flex-col gap-2.5">
        {holders.map(h => {
          const Icon: ComponentType<{ className?: string }> = h.icon;
          const owned = balances[h.key] ?? 0n;
          return (
            <div key={h.key} className="rounded-box flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-lab-violet" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {h.label}
                    {owned > 0n && (
                      <span className="badge badge-sm gap-1 font-mono text-lab-mint">
                        <CheckBadgeIcon className="h-3 w-3" /> holds {owned.toString()}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono text-base-content/50">{h.note}</span>
                  <Address address={h.address} disableAddressLink size="xs" />
                </div>
              </div>
              <MintButton tag={h.key} to={h.address} active={step === h.key} />
            </div>
          );
        })}
      </div>

      <div className="rounded-box flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 font-mono text-xs text-base-content/60">
        <span>
          tokenIdCounter = <span className="text-lab-mint">{counter.toString()}</span>
        </span>
        {lastUri && (
          <span className="min-w-0 break-all">
            tokenURI({counter.toString()}) = <span className="text-lab-violet">{lastUri}</span>
          </span>
        )}
      </div>

      {error &&
        (refused ? (
          <div className="rounded-box flex gap-3 border px-4 py-3">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-lab-violet" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="m-0 text-sm font-semibold">The contract refused the delivery. That is the feature.</p>
              <p className="m-0 text-sm text-base-content/80">
                <code className="font-mono">_safeMint</code> asked the vault{" "}
                <code className="font-mono">onERC721Received?</code> and got no answer, so the whole transaction rolled
                back: no token, no counter bump, nothing stranded. With plain <code className="font-mono">_mint</code>{" "}
                this would have &quot;succeeded&quot;, and the token would be locked in the vault forever.
              </p>
              <p className="m-0 break-all font-mono text-xs text-base-content/40">{error}</p>
            </div>
          </div>
        ) : (
          <span className="break-all font-mono text-xs text-lab-error">{error}</span>
        ))}

      {step === null && !error && (
        <p className="m-0 text-sm text-base-content/70">
          All three deliveries attempted: a wallet, a refusal, and a contract that passed the handshake. That refusal is
          the only reason the vault isn&apos;t sitting on a stranded token right now.
        </p>
      )}
    </div>
  );
};
