"use client";

// A transaction's life, made visible. A horizontal strip carries one action
// through the four beats the concept card names — and gas rides along the
// whole way:
//   • Compose  → your account states an intent; every change is a transaction.
//   • Sign     → your private key turns it into a unique hash nobody can forge.
//   • Mempool  → broadcast, it waits in the pool with everyone else's.
//   • Block    → a node packs it away; it's permanent, and the gas is the fee
//                that keeps the shared computer from being spammed.
// Plain DOM (no canvas) so the hash, the pool, and the block read crisply at
// any rail width; CSS transitions carry the motion.
import { useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  CubeIcon,
  FingerPrintIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";

type Phase = "compose" | "signed" | "mempool" | "mined";

const PHASE_INDEX: Record<Phase, number> = { compose: 0, signed: 1, mempool: 2, mined: 3 };
const STAGES = [
  { label: "Compose", icon: PencilSquareIcon },
  { label: "Sign", icon: FingerPrintIcon },
  { label: "Mempool", icon: QueueListIcon },
  { label: "Block", icon: CubeIcon },
];

const ACCOUNT = "0x71C2…F3a9";
const DEFAULT_MSG = "set greeting to gm";
const GAS_UNITS = "21,000";
const FEE = "0.00021 ETH";
// other transactions already waiting in the pool — yours lands among them
const DECOYS = [
  { hash: "0x9f3a…21bc", gas: "0.00018" },
  { hash: "0xc107…8e4d", gas: "0.00042" },
  { hash: "0x2b88…d9a1", gas: "0.00009" },
];

const HEX = "0123456789abcdef";
const randomHex = (n: number) => "0x" + Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join("");

// Deterministic 64-hex "keccak-looking" fingerprint of the input (xorshift) —
// illustrative, not real signing, but stable for a given message.
function hashHex(input: string): string {
  let h = (0x811c9dc5 ^ input.length) >>> 0;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 0x01000193) >>> 0;
  let state = h || 1;
  let out = "";
  for (let i = 0; i < 64; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    out += HEX[state & 0xf];
  }
  return "0x" + out;
}

const shortHash = (h: string) => (h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h);

const captionFor = (phase: Phase, signing: boolean) => {
  if (signing) return "Hashing and signing with your private key…";
  switch (phase) {
    case "compose":
      return "Your account is about to act. Type what you want to do — every change is a transaction, and every transaction costs gas.";
    case "signed":
      return "Your private key signed it into this unique hash. It proves the request is really yours, and nobody can forge or alter it.";
    case "mempool":
      return "Broadcast. Your transaction waits in the mempool with everyone else's until a node picks it up.";
    case "mined":
      return "A node packed it into a block and the network agreed — it's permanent now. The gas you paid is the fee that keeps the world computer from being spammed.";
  }
};

export const TransactionJourney = () => {
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [phase, setPhase] = useState<Phase>("compose");
  const [hash, setHash] = useState("");
  const [scramble, setScramble] = useState("");
  const [signing, setSigning] = useState(false);
  const [blockNumber, setBlockNumber] = useState(0);
  const [minedIn, setMinedIn] = useState(false); // drives the block's drop-in

  const scrambleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopScramble = () => {
    if (scrambleTimer.current) clearInterval(scrambleTimer.current);
    scrambleTimer.current = null;
  };
  useEffect(() => stopScramble, []);

  // a brief mount animation when the block seals
  useEffect(() => {
    if (phase !== "mined") return;
    setMinedIn(false);
    const raf = requestAnimationFrame(() => setMinedIn(true));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const idx = PHASE_INDEX[phase];

  const sign = () => {
    const msg = message.trim();
    if (!msg || signing) return;
    setHash(hashHex(`${ACCOUNT}:${msg}:${Date.now()}`));
    setPhase("signed");
    setSigning(true);
    let ticks = 0;
    stopScramble();
    scrambleTimer.current = setInterval(() => {
      setScramble(randomHex(64));
      if (++ticks > 12) {
        stopScramble();
        setSigning(false);
      }
    }, 55);
  };

  const broadcast = () => setPhase("mempool");
  const mine = () => {
    setBlockNumber(21_000_000 + Math.floor(Math.random() * 900_000));
    setPhase("mined");
  };
  const reset = () => {
    stopScramble();
    setSigning(false);
    setHash("");
    setMessage(DEFAULT_MSG);
    setPhase("compose");
  };

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">gas fee</span>
          <strong className="font-semibold text-dark-text">≈ {FEE}</strong>
        </span>
        <button
          type="button"
          onClick={reset}
          className="font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      {/* the strip: four stations, a track that fills as the tx advances */}
      <div className="relative px-1">
        <div className="absolute left-6 right-6 top-[15px] h-0.5 bg-dark-border" />
        <div
          className="absolute left-6 top-[15px] h-0.5 bg-violet-bright transition-all duration-500"
          style={{ width: `calc((100% - 3rem) * ${idx / (STAGES.length - 1)})` }}
        />
        <ol className="relative flex justify-between">
          {STAGES.map((stage, i) => {
            const done = i < idx;
            const active = i === idx;
            const Icon = stage.icon;
            return (
              <li key={stage.label} className="flex w-12 flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? "border-violet-bright bg-violet-bright text-[#1a102c]"
                      : done
                        ? "border-violet-bright bg-lab-code-panel-tint text-violet-bright"
                        : "border-dark-border bg-dark-bg text-dark-text-faint"
                  }`}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span
                  className={`text-[10px] font-medium ${active || done ? "text-dark-text" : "text-dark-text-faint"}`}
                >
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="m-0 min-h-[3.25rem] text-sm leading-relaxed text-dark-text-muted">{captionFor(phase, signing)}</p>

      <div className="min-h-[150px]">
        {phase === "compose" && (
          <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-surface p-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-violet-bright to-[#ff7ccb]" />
              <span className="font-mono text-dark-text">{ACCOUNT}</span>
              <span className="text-dark-text-faint">your account</span>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">Action</span>
              <input
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                placeholder={DEFAULT_MSG}
                className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 font-mono text-sm text-dark-text outline-none transition-colors focus:border-violet-bright"
              />
            </label>
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-text-muted">Gas {GAS_UNITS} units</span>
              <span className="font-mono text-dark-text">≈ {FEE}</span>
            </div>
          </div>
        )}

        {(phase === "signed" || phase === "mempool") && (
          <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-surface p-4">
            <Field label="Action" value={message} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">
                Signed hash
              </span>
              <code className="break-all rounded-lg border border-dark-border bg-dark-bg px-3 py-2 font-mono text-xs leading-relaxed text-violet-bright">
                {signing ? scramble || "0x…" : hash}
              </code>
            </div>

            {phase === "mempool" && (
              <div className="flex flex-col gap-2 rounded-lg border border-dark-border bg-dark-bg p-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">
                  Mempool · pending
                </span>
                <MempoolRow hash={DECOYS[0].hash} gas={DECOYS[0].gas} />
                <MempoolRow hash={DECOYS[1].hash} gas={DECOYS[1].gas} />
                <MempoolRow hash={shortHash(hash)} gas={FEE.replace(" ETH", "")} mine />
                <MempoolRow hash={DECOYS[2].hash} gas={DECOYS[2].gas} />
              </div>
            )}
          </div>
        )}

        {phase === "mined" && (
          <div
            className={`flex flex-col gap-3 rounded-xl border border-violet-bright bg-dark-surface p-4 transition-all duration-500 ${
              minedIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-sm text-dark-text">
                <CubeIcon className="h-4 w-4 text-violet-bright" />
                Block #{blockNumber.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-lab-code-panel-tint px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-bright">
                <LockClosedIcon className="h-3 w-3" />
                permanent
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-bg px-3 py-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-lab-mint" />
              <div className="min-w-0">
                <div className="truncate font-mono text-xs text-violet-bright">{shortHash(hash)}</div>
                <div className="truncate text-xs text-dark-text-muted">{message}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-text-muted">Gas paid to the network</span>
              <span className="font-mono text-dark-text">{FEE}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {phase === "compose" && (
          <PrimaryButton onClick={sign} disabled={!message.trim()} icon={FingerPrintIcon}>
            Sign transaction
          </PrimaryButton>
        )}
        {phase === "signed" && (
          <PrimaryButton onClick={broadcast} disabled={signing} icon={PaperAirplaneIcon}>
            Broadcast
          </PrimaryButton>
        )}
        {phase === "mempool" && (
          <PrimaryButton onClick={mine} icon={CubeIcon}>
            Mine the block
          </PrimaryButton>
        )}
        {phase === "mined" && (
          <PrimaryButton onClick={reset} icon={ArrowPathIcon}>
            Send another
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">{label}</span>
    <span className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 font-mono text-sm text-dark-text">
      {value}
    </span>
  </div>
);

const MempoolRow = ({ hash, gas, mine }: { hash: string; gas: string; mine?: boolean }) => (
  <div
    className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs ${
      mine ? "bg-lab-code-panel-tint" : "opacity-50"
    }`}
  >
    <span className={`font-mono ${mine ? "text-violet-bright" : "text-dark-text-muted"}`}>{hash}</span>
    <span className="flex items-center gap-2 font-mono text-dark-text-muted">
      {gas} ETH
      {mine && (
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-bright px-1.5 py-0.5 text-[9px] font-semibold uppercase text-violet-bright">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-bright" />
          yours
        </span>
      )}
    </span>
  </div>
);

const PrimaryButton = ({
  onClick,
  disabled,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:opacity-50"
  >
    <Icon className="h-4 w-4" />
    {children}
  </button>
);
