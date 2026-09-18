"use client";

// Signing, with a real wallet and no chain in sight. The learner connects an
// extension wallet, signs a message they wrote themselves, and then watches the
// signature get traced back to their own address.
//
// Everything here is offline math: signMessage never touches an RPC, and
// recoverMessageAddress is pure secp256k1 — no public client, no network. That
// is the whole point of the card, so nothing in this widget may reach for a
// chain. It works the same on a vercel deploy as it does locally, on whatever
// network the wallet happens to be pointed at.
import { useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { type Address, recoverMessageAddress } from "viem";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

const MESSAGE = "Hello, World";

const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

// Wallet rejections come back as verbose provider errors; the learner only
// needs the one sentence, and declining is a lesson, not a failure.
const readableError = (error: unknown) => {
  const message = (error as Error)?.message ?? "";
  if (/user rejected|denied|rejected the request/i.test(message)) {
    return "You declined the signature. That's always your call — a wallet can ask, but it can't sign for you.";
  }
  return message.split("\n")[0] || "Something went wrong while signing.";
};

// hex values break anywhere; the learner's own prose breaks on words and keeps
// its line breaks, so what's on screen is exactly what they signed
const Field = ({ label, prose, children }: { label: string; prose?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="font-mono text-xs text-dark-text-muted">{label}</span>
    <span
      className={`rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 text-xs ${
        prose ? "whitespace-pre-wrap break-words" : "break-all font-mono"
      }`}
    >
      {children}
    </span>
  </div>
);

export const SignMessage = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending } = useSignMessage();

  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [signer, setSigner] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearResult = () => {
    setSignature(null);
    setSigner(null);
    setError(null);
  };

  const sign = async () => {
    clearResult();
    try {
      const sig = await signMessageAsync({ message: MESSAGE });
      // recovery is pure math on the message + signature: no rpc, no chain, no
      // wallet. anyone holding those two strings can run the same check.
      setSigner(await recoverMessageAddress({ message: MESSAGE, signature: sig }));
      setSignature(sig);
    } catch (e) {
      setError(readableError(e));
    }
  };

  const matches = Boolean(signer && address && signer.toLowerCase() === address.toLowerCase());

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <span className="self-start rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs text-dark-text-muted">
        no chain · no gas · nothing broadcast
      </span>

      {!isConnected ? (
        <>
          <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
            Connect a wallet to sign something yourself. Nothing here spends money or sends a transaction — the wallet
            is only being asked to prove it holds a key.
          </p>
          <button
            type="button"
            onClick={openConnectModal}
            disabled={!openConnectModal}
            className="inline-flex cursor-pointer items-center gap-2 self-start rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Connect wallet
          </button>
          <p className="m-0 text-xs leading-relaxed text-dark-text-faint">
            No wallet installed? Read on — the next cards don&apos;t need one.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-dark-text-muted">
              signing as <span className="text-dark-text">{short(address ?? "")}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                clearResult();
                disconnect();
              }}
              className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
            >
              disconnect
            </button>
          </div>

          <Field label="the message" prose>
            {MESSAGE}
          </Field>

          <button
            type="button"
            onClick={sign}
            disabled={isPending}
            className="inline-flex cursor-pointer items-center gap-2 self-start rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Check your wallet…" : "Sign message"}
          </button>

          {error && <p className="m-0 text-sm leading-relaxed text-peach-bright">{error}</p>}

          {signature && (
            <div className="flex flex-col gap-3 rounded-lg border border-dark-border bg-lab-code-panel-tint p-3">
              <span className="font-mono text-xs text-dark-text-muted">message + signature → address</span>
              <Field label="signature">{signature}</Field>
              <Field label="address recovered">
                <span className={matches ? "text-mint-bright" : "text-peach-bright"}>{signer}</span>
              </Field>
              <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
                {matches ? (
                  <>
                    That&apos;s your address, worked out from those two inputs alone. Your key never left the wallet,
                    and nothing was sent anywhere — this whole check ran in your browser.
                  </>
                ) : (
                  <>The recovered address doesn&apos;t match the connected one. Try signing again.</>
                )}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
