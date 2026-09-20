"use client";

// The learner's real Sepolia balance, rendered inline in the card body (the
// card's `illustrations` slot) rather than behind the interactive button —
// the number is the lesson, so it shouldn't need a click to appear.
//
// The read is by address alone: a public node answers it for anyone who asks,
// with no key and no signature involved. That's the point the card makes, so
// this deliberately reads the chain rather than asking the wallet.
import type { ReactNode } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, formatEther, http } from "viem";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

// Sepolia is read through a client of this card's own, not through wagmi. The
// app targets mainnet, and a lab card has no business re-pointing the whole
// dApp's networks just to print one number — wagmi would also throw
// ChainNotConfiguredError for a chain missing from scaffold.config.
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(getAlchemyHttpUrl(sepolia.id) ?? undefined),
});

// four decimals is plenty for faucet-sized amounts, and trailing zeros read as
// noise next to a number the learner is meant to recognise as theirs
const format = (formatted: string) => {
  const n = Number(formatted);
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return String(Number(n.toFixed(4)));
};

const Panel = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-lab-border bg-lab-inset px-5 py-4">{children}</div>
);

export const SepoliaBalance = ({ children }: { children?: ReactNode }) => {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    data: balance,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sepolia-balance", address],
    queryFn: () => sepoliaClient.getBalance({ address: address as `0x${string}` }),
    enabled: Boolean(address),
  });

  if (!address) {
    return (
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-lab-muted">
            Connect your wallet to see your own balance here. It doesn&apos;t matter which network it&apos;s on — this
            reads Sepolia either way.
          </p>
          <button
            type="button"
            onClick={openConnectModal}
            disabled={!openConnectModal}
            className="btn btn-sm border-lab-border bg-lab-surface text-lab-text hover:border-lab-violet hover:text-lab-violet disabled:opacity-50"
          >
            Connect wallet
          </button>
        </div>
        {children}
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-lab-faint">address</span>
          <span className="break-all font-mono text-sm text-lab-text">{address}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-lab-faint">balance on Sepolia</span>
          {isLoading ? (
            <span className="font-mono text-2xl text-lab-faint">reading…</span>
          ) : isError || balance === undefined ? (
            <span className="font-mono text-sm text-lab-error">
              couldn&apos;t reach Sepolia just now — refresh the page to try again
            </span>
          ) : (
            <span className="font-mono text-2xl tabular-nums text-lab-text">
              {format(formatEther(balance))} <span className="text-base text-lab-muted">ETH</span>
            </span>
          )}
        </div>

        {balance === 0n && (
          <p className="m-0 text-sm text-lab-muted">
            Zero is a perfectly real answer. Your account exists the moment the key does — nobody had to open it for
            you, and nothing had to be deposited first.
          </p>
        )}
      </div>
      {children}
    </Panel>
  );
};
