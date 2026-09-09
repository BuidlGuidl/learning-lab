"use client";

// The lab's first real transaction: a vote on a live poll contract on Sepolia.
//
// Rendered inline in the card body (the card's `illustrations` slot) rather
// than in the interactive side rail — the rail overlays the prose, and this
// card's prose is the instructions for using the poll. So it is styled with the
// theme-aware lab-* tokens like every other inline illustration, not the rail's
// fixed dark palette.
//
// Two deliberate departures from how a production dApp would behave, both in
// service of the lesson:
//
//   • The vote button stays live after the learner has voted. A real app would
//     disable it; here, sending a second vote is the point — the contract's one
//     rule rejects it and the learner gets to see a revert with their own eyes.
//   • The write hook sets disableSimulate, because SE-2 otherwise simulates
//     first and blocks a failing transaction before the wallet ever opens. The
//     revert has to reach MetaMask for the learner to see it.
//
// Consequence of skipping simulation: gas estimation reverts too, and the
// client then falls back to the block gas limit, which the node rejects on a
// gas-cap error that hides the real reason. Hence the explicit gas below — it
// keeps the failure legible as "the contract said no".
//
// Everything below distinguishes "not read yet" from "genuinely zero". A poll
// that renders 0/0/0/0 while the chain is unreachable teaches the learner
// something false about a contract they can't yet read for themselves.
import { useState } from "react";
import type { ReactNode } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";
import { useAccount, useSwitchChain } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError } from "~~/utils/scaffold-eth";
import { contracts } from "~~/utils/scaffold-eth/contract";

// Matches the Season enum in SeasonPoll.sol — index is the uint8 sent on-chain.
// Bars carry a light/dark pair: the *-bright ramp is legible on the dark card
// surface but washes out on the light one.
const SEASONS = [
  { label: "Winter", emoji: "❄️", bar: "bg-ethereum-violet dark:bg-violet-bright" },
  { label: "Spring", emoji: "🌸", bar: "bg-mint dark:bg-mint-bright" },
  { label: "Summer", emoji: "☀️", bar: "bg-peach-deep dark:bg-peach-bright" },
  { label: "Autumn", emoji: "🍂", bar: "bg-magenta-deep dark:bg-magenta-bright" },
];

// The address the card names is a build-time fact from externalContracts, so it
// is read straight off the map rather than from useDeployedContractInfo — that
// hook withholds its data until a getBytecode probe answers, and "which
// contract am I voting on" shouldn't blank out when an RPC is having a moment.
// Exported because the chapter's prose quotes the same address: a redeploy that
// updates externalContracts must move both, so they read from one place.
export const POLL_ADDRESS = contracts?.[sepolia.id]?.SeasonPoll?.address;

// A failing vote still costs gas, so it must be a real limit, not a guess that
// runs out — a vote writes one mapping entry and emits one event.
const VOTE_GAS = 150_000n;

const Panel = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-lab-border bg-lab-inset px-5 py-4">{children}</div>
);

export const SeasonPoll = ({ children }: { children?: ReactNode }) => {
  const { address, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reads are pinned to Sepolia rather than the connected chain, so the tallies
  // are already on screen before the learner connects anything.
  const { data: contract, isLoading: contractLoading } = useDeployedContractInfo({
    contractName: "SeasonPoll",
    chainId: sepolia.id,
  });
  const { data: results } = useScaffoldReadContract({
    contractName: "SeasonPoll",
    functionName: "getResults",
    chainId: sepolia.id,
  });
  const { data: myVote } = useScaffoldReadContract({
    contractName: "SeasonPoll",
    functionName: "voteOf",
    args: [address],
    chainId: sepolia.id,
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "SeasonPoll",
    chainId: sepolia.id,
    disableSimulate: true,
  });

  const tallies = results?.[0];
  const totalVotes = results?.[1];
  const votedSeason = myVote?.[0] ? Number(myVote[1]) : null;
  const onSepolia = chain?.id === sepolia.id;
  // Without a wallet the poll is a read-only scoreboard: the tallies are public
  // data, but picking a season is the first half of sending a transaction, and
  // there is no account to send it from yet.
  const connected = Boolean(address);
  // The reads and the write both hang off this lookup, so when it comes back
  // empty the whole card is inert — say so rather than leaving dead controls.
  const unreachable = !contractLoading && !contract;

  const castVote = async () => {
    if (selected === null) return;
    setError(null);
    try {
      await writeContractAsync({ functionName: "vote", args: [selected], gas: VOTE_GAS });
    } catch (e) {
      setError(getParsedError(e));
    }
  };

  const goToSepolia = async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: sepolia.id });
    } catch (e) {
      setError(getParsedError(e));
    }
  };

  return (
    <Panel>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-lab-faint">poll contract on Sepolia</span>
          <span className="break-all font-mono text-xs text-lab-muted">{POLL_ADDRESS}</span>
        </div>

        <div className="flex flex-col gap-2">
          {SEASONS.map((season, index) => {
            const count = tallies ? Number(tallies[index] ?? 0n) : null;
            const pct = count !== null && totalVotes ? (count / Number(totalVotes)) * 100 : 0;
            const isMine = votedSeason === index;
            const isSelected = selected === index;
            return (
              <button
                key={season.label}
                type="button"
                onClick={() => setSelected(index)}
                disabled={!connected}
                aria-pressed={isSelected}
                className={`flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "border-lab-violet bg-lab-tint" : "border-lab-border bg-lab-surface"
                } ${connected ? "cursor-pointer hover:border-lab-violet" : "cursor-not-allowed"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-lab-text">
                    <span aria-hidden className="mr-1.5">
                      {season.emoji}
                    </span>
                    {season.label}
                    {isMine && <span className="ml-2 font-mono text-xs text-lab-violet">your vote</span>}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-lab-muted">
                    {count === null ? "—" : `${count} ${count === 1 ? "vote" : "votes"}`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-lab-track">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${season.bar} ${
                      isMine ? "opacity-100" : "opacity-60"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className={`font-mono text-xs ${unreachable ? "text-lab-error" : "text-lab-faint"}`}>
            {unreachable
              ? "couldn't reach Sepolia just now — refresh the page to try again"
              : totalVotes === undefined
                ? "reading the tallies from Sepolia…"
                : `${Number(totalVotes)} ${Number(totalVotes) === 1 ? "vote" : "votes"} total`}
          </span>

          {connected && !onSepolia ? (
            <button
              type="button"
              onClick={goToSepolia}
              disabled={isSwitching}
              className="btn btn-sm shrink-0 border-lab-border bg-lab-surface text-lab-text hover:border-lab-violet hover:text-lab-violet"
            >
              {isSwitching ? "Switching…" : "Switch to Sepolia"}
            </button>
          ) : (
            <button
              type="button"
              onClick={castVote}
              disabled={!connected || !contract || selected === null || isMining}
              className="btn btn-primary btn-sm shrink-0"
            >
              {isMining ? "Confirming…" : "Vote"}
            </button>
          )}
        </div>

        {!connected && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 flex-1 text-sm text-lab-muted">
              The tallies above are public — anyone can read them without a wallet. Voting is the other half: it takes a
              transaction signed by an account, so the seasons and the vote button stay locked until you connect one.
            </p>
            <button
              type="button"
              onClick={openConnectModal}
              disabled={!openConnectModal}
              className="btn btn-sm shrink-0 border-lab-border bg-lab-surface text-lab-text hover:border-lab-violet hover:text-lab-violet disabled:opacity-50"
            >
              Connect wallet
            </button>
          </div>
        )}

        {/* Kept deliberately: the second vote's revert is the lesson, not a bug. */}
        {error && <p className="m-0 font-mono text-xs leading-relaxed text-lab-error">{error}</p>}

        {votedSeason !== null && (
          <p className="m-0 text-sm text-lab-muted">
            {"Your vote for "}
            <strong className="text-lab-text">{SEASONS[votedSeason]?.label}</strong>
            {" is now part of Sepolia’s permanent record."}
          </p>
        )}
      </div>
      {children}
    </Panel>
  );
};
