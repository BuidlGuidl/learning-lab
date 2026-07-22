"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  FingerPrintIcon,
  PaperAirplaneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Outcome = "success" | "revert";

const STAGES = [
  { label: "Request", icon: PaperAirplaneIcon },
  { label: "Signed", icon: FingerPrintIcon },
  { label: "Pending", icon: ClockIcon },
  { label: "Included", icon: CubeIcon },
  { label: "Confirmed", icon: CheckCircleIcon },
];

const captionFor = (step: number, outcome: Outcome) => {
  switch (step) {
    case 0:
      return "Alex's wallet shows a request to support Mina's Open Garden project with 0.01 ETH. Choose the result you want to explore, then sign.";
    case 1:
      return "Signed. Your private key authorized these exact transaction details without revealing the key itself.";
    case 2:
      return "Broadcast. The transaction is in the pending pool with other requests, waiting for a validator to select it.";
    case 3:
      return outcome === "success"
        ? "Included and executed. The contract accepted the action, changed its state, and gas was charged."
        : "Included and executed, but the contract rejected the action and reverted its state changes. The computation still used gas.";
    default:
      return outcome === "success"
        ? "Confirmed. Other nodes verified the block and applications can now read the updated shared state."
        : "Confirmed as reverted. The project state did not change, but the included transaction and its gas charge remain in history.";
  }
};

const actionFor = (step: number) => {
  if (step === 0) return "Sign request";
  if (step === 1) return "Broadcast";
  if (step === 2) return "Include in block";
  if (step === 3) return "Confirm block";
  return "Run again";
};

export const TransactionJourney = () => {
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("success");

  const advance = () => setStep(current => (current >= STAGES.length - 1 ? 0 : current + 1));

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">gas charged</span>
          <strong className="font-semibold text-dark-text">{step >= 3 ? "0.0004 ETH" : "not yet"}</strong>
        </span>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <ol className="grid grid-cols-5 gap-1">
        {STAGES.map((stage, index) => {
          const Icon = index === 4 && outcome === "revert" && step >= 3 ? XCircleIcon : stage.icon;
          const active = index === step;
          const complete = index < step;
          const failed = outcome === "revert" && step >= 3 && index >= 3;
          return (
            <li key={stage.label} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
                  failed
                    ? "border-error bg-error/10 text-error"
                    : active
                      ? "border-violet-bright bg-violet-bright text-[#1a102c]"
                      : complete
                        ? "border-lab-mint/60 bg-lab-mint/10 text-lab-mint"
                        : "border-dark-border bg-dark-bg text-dark-text-faint"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="w-full truncate text-[9px] font-medium text-dark-text-muted sm:text-[10px]">
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-dark-border bg-dark-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-dark-text-muted">support Open Garden</span>
          <span className="font-mono text-dark-text">0.01 ETH</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-dark-text-muted">expected result</span>
          <span className={outcome === "success" ? "text-lab-mint" : "text-error"}>
            {outcome === "success" ? "state updated" : "contract reverts"}
          </span>
        </div>
      </div>

      {step === 0 && (
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose transaction outcome">
          <button
            type="button"
            onClick={() => setOutcome("success")}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              outcome === "success"
                ? "border-lab-mint bg-lab-mint/10 text-dark-text"
                : "border-dark-border text-dark-text-muted hover:border-lab-mint"
            }`}
          >
            Successful action
          </button>
          <button
            type="button"
            onClick={() => setOutcome("revert")}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              outcome === "revert"
                ? "border-error/70 bg-error/10 text-dark-text"
                : "border-dark-border text-dark-text-muted hover:border-error/70"
            }`}
          >
            Reverted action
          </button>
        </div>
      )}

      <p className="m-0 min-h-[4.5rem] text-sm leading-relaxed text-dark-text-muted">{captionFor(step, outcome)}</p>

      <button
        type="button"
        onClick={advance}
        className="btn btn-sm self-start border-0 bg-violet-bright text-[#1a102c] hover:bg-violet-bright/90"
      >
        {actionFor(step)}
      </button>
    </div>
  );
};
