"use client";

// A transaction's life, made visible — the three beats the concept card names,
// with the network's rule-check at the centre and gas riding along:
//   • Sign      → your wallet signs with your private key; only your key could
//                 produce this signature, and it can't be forged or altered.
//   • Broadcast → every node independently checks the rules (is the signature
//                 yours? do you hold the ETH?). The network enforces; nobody
//                 waves it through.
//   • Block     → pass, and it's packed into a block and appended to the chain,
//                 permanent. Fail, and every node refuses it: an invalid tx
//                 never reaches a block, so it costs nothing.
// The student picks how much to send, including more than they hold, so the
// "you can't spend what you don't have, and no operator can wave it through"
// moment is theirs to trigger.
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  CubeIcon,
  FingerPrintIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Phase = "compose" | "signed" | "checking" | "mined" | "rejected";

const STAGES = [
  { label: "Sign", icon: FingerPrintIcon },
  { label: "Broadcast", icon: PaperAirplaneIcon },
  { label: "Block", icon: CubeIcon },
];
// which strip station each phase lights
const PHASE_STAGE: Record<Phase, number> = { compose: 0, signed: 1, checking: 1, mined: 2, rejected: 1 };

const ACCOUNT = "0x71C2…F3a9";
const RECIPIENT = "0x4Db8…A07e";
const BALANCE = 1; // ETH the account holds
const GAS_FEE = 0.0002; // ETH, the network's fee for the work
const AMOUNTS = [0.25, 2]; // one you can afford, one you can't — both offered on purpose
const REJECT = "#ff8a8a"; // soft red for the rejected path

const HEX = "0123456789abcdef";
const randomHex = (n: number) => "0x" + Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join("");

// Deterministic 64-hex "keccak-looking" fingerprint of the input (xorshift) —
// illustrative, not real signing, but stable for a given input.
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

const fmt = (n: number) => n.toFixed(4);

const captionFor = (phase: Phase, signing: boolean) => {
  if (signing) return "Your wallet is signing it with your private key…";
  switch (phase) {
    case "compose":
      return "Your account wants to send ETH to another address. Pick an amount: every change is a transaction, and every transaction costs gas.";
    case "signed":
      return "Signed. Only your private key could produce this signature, and nobody can forge it or change a single detail.";
    case "checking":
      return "Broadcast. Every node independently checks the rules before accepting it: is the signature yours, and do you hold the ETH?";
    case "mined":
      return "It passed. A node packed it into a block and appended it to the chain, permanent and impossible to undo.";
    case "rejected":
      return "Every node refused to carry it: you can't send ETH you don't have, and no one can wave it through. It never reached a block, so it cost you nothing.";
  }
};

export const TransactionJourney = () => {
  const [amount, setAmount] = useState(AMOUNTS[0]);
  const [phase, setPhase] = useState<Phase>("compose");
  const [hash, setHash] = useState("");
  const [scramble, setScramble] = useState("");
  const [signing, setSigning] = useState(false);
  const [blockNumber, setBlockNumber] = useState(0);

  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scrambleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const enough = amount + GAS_FEE <= BALANCE;
  const stage = PHASE_STAGE[phase];

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (scrambleTimer.current) clearInterval(scrambleTimer.current);
    scrambleTimer.current = null;
  };
  useEffect(() => clearTimers, []);

  const sign = () => {
    if (signing) return;
    setHash(hashHex(`${ACCOUNT}->${RECIPIENT}:${amount}:${Date.now()}`));
    setPhase("signed");
    setSigning(true);
    let ticks = 0;
    scrambleTimer.current = setInterval(() => {
      setScramble(randomHex(64));
      if (++ticks > 12) {
        clearTimers();
        setSigning(false);
      }
    }, 55);
  };

  // broadcast and let the nodes check — the outcome depends on the amount
  const broadcast = () => {
    setPhase("checking");
    const t = setTimeout(() => {
      if (enough) {
        setBlockNumber(21_000_000 + Math.floor(Math.random() * 900_000));
        setPhase("mined");
      } else {
        setPhase("rejected");
      }
    }, 1500);
    timers.current.push(t);
  };

  const reset = () => {
    clearTimers();
    setSigning(false);
    setHash("");
    setPhase("compose");
  };

  const failed = phase === "rejected";

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">gas fee</span>
          <strong className="font-semibold text-dark-text">≈ {fmt(GAS_FEE)} ETH</strong>
        </span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      {/* the strip: three stations, a track that fills as the tx advances */}
      <div className="relative px-1">
        <div className="absolute left-6 right-6 top-[15px] h-0.5 bg-dark-border" />
        <div
          className="absolute left-6 top-[15px] h-0.5 bg-violet-bright transition-all duration-500"
          style={{ width: `calc((100% - 3rem) * ${stage / (STAGES.length - 1)})` }}
        />
        <ol className="relative flex justify-between">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isFailStation = failed && i === STAGES.length - 1;
            const done = failed ? i < STAGES.length - 1 : i < stage;
            const active = !failed && i === stage;
            return (
              <li key={s.label} className="flex w-12 flex-col items-center gap-1.5">
                <span className="relative z-10 h-8 w-8">
                  {/* opaque base so the track line reads as passing behind the node */}
                  <span className="absolute inset-0 rounded-full bg-dark-bg" aria-hidden />
                  <span
                    className={`absolute inset-0 flex items-center justify-center rounded-full border transition-colors ${
                      isFailStation
                        ? "border-[#ff8a8a] bg-dark-bg text-[#ff8a8a]"
                        : active
                          ? "border-violet-bright bg-violet-bright text-[#1a102c]"
                          : done
                            ? "border-violet-bright bg-lab-code-panel-tint text-violet-bright"
                            : "border-dark-border bg-dark-bg text-dark-text-faint"
                    }`}
                  >
                    {isFailStation ? (
                      <XMarkIcon className="h-4 w-4" />
                    ) : done ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isFailStation ? "text-[#ff8a8a]" : active || done ? "text-dark-text" : "text-dark-text-faint"
                  }`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="m-0 min-h-[3.25rem] text-sm leading-relaxed text-dark-text-muted">{captionFor(phase, signing)}</p>

      <div className="min-h-[176px]">
        {phase === "compose" && (
          <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-surface p-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-violet-bright to-[#ff7ccb]" />
                <span className="font-mono text-dark-text">{ACCOUNT}</span>
                <span className="text-dark-text-faint">you</span>
              </span>
              <span className="font-mono text-dark-text-muted">{fmt(BALANCE)} ETH</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <PaperAirplaneIcon className="h-4 w-4 shrink-0 text-dark-text-faint" />
              <span className="text-dark-text-muted">send to</span>
              <span className="truncate font-mono text-dark-text">{RECIPIENT}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">Amount</span>
              <div className="flex gap-2">
                {AMOUNTS.map(a => {
                  const sel = a === amount;
                  const afford = a + GAS_FEE <= BALANCE;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-left font-mono text-sm transition-colors ${
                        sel
                          ? "border-violet-bright bg-lab-code-panel-tint text-dark-text"
                          : "border-dark-border bg-dark-bg text-dark-text-muted hover:border-violet-bright/60"
                      }`}
                    >
                      {a} ETH
                      {!afford && <span className="ml-1 text-[10px] text-dark-text-faint">over balance</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {phase === "signed" && (
          <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-surface p-4">
            <SummaryLine amount={amount} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">Signature</span>
              <code className="break-all rounded-lg border border-dark-border bg-dark-bg px-3 py-2 font-mono text-xs leading-relaxed text-violet-bright">
                {signing ? scramble || "0x…" : hash}
              </code>
            </div>
            {!signing &&
              (enough ? (
                <span className="flex items-center gap-1.5 text-xs text-dark-text-muted">
                  <ShieldCheckIcon className="h-4 w-4 shrink-0 text-lab-mint" />
                  Produced by your private key. Nobody can forge it.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: REJECT }}>
                  <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                  Signing only proves it&apos;s you. The network still has to accept it, and you don&apos;t hold this
                  much.
                </span>
              ))}
          </div>
        )}

        {phase === "checking" && (
          <div className="flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-surface p-4">
            <SummaryLine amount={amount} />
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">
                Nodes checking
              </span>
              <CheckRow label="Signature is really yours" state="checking" />
              <CheckRow label="Account holds enough ETH" state="checking" />
            </div>
          </div>
        )}

        {phase === "mined" && (
          <div className="flex flex-col gap-3 rounded-xl border border-violet-bright bg-dark-surface p-4">
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
            <ChainView blockNumber={blockNumber} />
            <div className="flex flex-col gap-1.5">
              <CheckRow label="Signature is really yours" state="pass" />
              <CheckRow label="Account holds enough ETH" state="pass" />
            </div>
            <BalanceAfter to={BALANCE - amount - GAS_FEE} note="amount sent, plus gas" />
          </div>
        )}

        {phase === "rejected" && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#ff8a8a]/40 bg-dark-surface p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-sm text-[#ff8a8a]">
                <XMarkIcon className="h-4 w-4" />
                Rejected
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-dark-text-faint">
                never reached a block
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <CheckRow label="Signature is really yours" state="pass" />
              <CheckRow
                label="Account holds enough ETH"
                state="fail"
                note={`(needs more than your ${fmt(BALANCE)} ETH)`}
              />
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-dark-text-muted">Your balance</span>
                <span className="font-mono text-dark-text">{fmt(BALANCE)} ETH unchanged</span>
              </div>
              <span className="text-[11px] text-dark-text-faint">it never reached a block, so no gas was charged</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {phase === "compose" && (
          <PrimaryButton onClick={sign} icon={FingerPrintIcon}>
            Sign with your key
          </PrimaryButton>
        )}
        {phase === "signed" && (
          <PrimaryButton onClick={broadcast} disabled={signing} icon={PaperAirplaneIcon}>
            Broadcast
          </PrimaryButton>
        )}
        {phase === "checking" && (
          <PrimaryButton onClick={() => undefined} disabled icon={PaperAirplaneIcon}>
            Checking…
          </PrimaryButton>
        )}
        {(phase === "mined" || phase === "rejected") && (
          <PrimaryButton onClick={reset} icon={ArrowPathIcon}>
            Send another
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

const SummaryLine = ({ amount }: { amount: number }) => (
  <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 font-mono text-xs">
    <span className="text-dark-text">Send {amount} ETH</span>
    <span className="text-dark-text-faint">→</span>
    <span className="truncate text-dark-text-muted">{RECIPIENT}</span>
  </div>
);

const CheckRow = ({ label, state, note }: { label: string; state: "checking" | "pass" | "fail"; note?: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {state === "checking" ? (
      <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full border border-dark-text-faint" />
    ) : state === "pass" ? (
      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-lab-mint" />
    ) : (
      <XMarkIcon className="h-3.5 w-3.5 shrink-0" style={{ color: REJECT }} />
    )}
    <span
      style={state === "fail" ? { color: REJECT } : undefined}
      className={state === "fail" ? "" : "text-dark-text-muted"}
    >
      {label}
      {note && <span className="text-dark-text-faint"> {note}</span>}
    </span>
  </div>
);

const BalanceAfter = ({ to, note }: { to: number; note: string }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs">
    <div className="flex items-center justify-between">
      <span className="text-dark-text-muted">Your balance</span>
      <span className="font-mono text-dark-text">
        {fmt(BALANCE)} <span className="text-dark-text-faint">→</span> {fmt(to)} ETH
      </span>
    </div>
    <span className="text-[11px] text-dark-text-faint">{note}</span>
  </div>
);

const ChainView = ({ blockNumber }: { blockNumber: number }) => (
  <div className="flex items-center justify-center gap-1 py-1">
    <span className="text-xs text-dark-text-faint">…</span>
    {[0, 1].map(i => (
      <Fragment key={i}>
        <span className="rounded-md border border-dark-border bg-dark-bg px-2.5 py-1.5 opacity-60">
          <CubeIcon className="h-4 w-4 text-dark-text-faint" />
        </span>
        <span className="h-px w-2 bg-dark-border" />
      </Fragment>
    ))}
    <span className="flex flex-col items-center gap-0.5 rounded-md border border-violet-bright bg-lab-code-panel-tint px-2.5 py-1.5">
      <CubeIcon className="h-4 w-4 text-violet-bright" />
      <span className="font-mono text-[9px] text-violet-bright">#…{String(blockNumber).slice(-4)}</span>
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
    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Icon className="h-4 w-4" />
    {children}
  </button>
);
