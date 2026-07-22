"use client";

import { useState } from "react";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type Result = "idle" | "accepted" | "rejected";

export const ContractRules = () => {
  const [supporters, setSupporters] = useState(128);
  const [result, setResult] = useState<Result>("idle");

  const trySupport = (payment: number) => {
    if (result === "accepted") return;

    if (payment === 0.01) {
      setSupporters(current => current + 1);
      setResult("accepted");
      return;
    }

    setResult("rejected");
  };

  const reset = () => {
    setSupporters(128);
    setResult("idle");
  };

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="rounded-xl border border-dark-border bg-dark-surface p-4">
        <p className="m-0 font-mono text-xs uppercase tracking-wider text-violet-bright">Open Garden rule</p>
        <p className="mb-0 mt-2 text-sm text-dark-text-muted">
          Record one new supporter only when the contribution is exactly{" "}
          <strong className="text-dark-text">0.01 ETH</strong>.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-dark-border bg-lab-code-panel-tint px-4 py-3">
        <span className="text-sm text-dark-text-muted">Supporters in shared state</span>
        <strong className="font-mono text-lg text-dark-text">{supporters}</strong>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-sm" onClick={() => trySupport(0.005)}>
          Send 0.005 ETH
        </button>
        <button type="button" className="btn btn-sm bg-violet-bright text-[#1a102c]" onClick={() => trySupport(0.01)}>
          Send 0.01 ETH
        </button>
      </div>

      {result !== "idle" && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            result === "accepted"
              ? "border-lab-mint/50 bg-lab-mint/10 text-lab-mint"
              : "border-error/50 bg-error/10 text-error"
          }`}
          role="status"
        >
          {result === "accepted" ? (
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>
            {result === "accepted"
              ? "Accepted. The program followed its rule and updated Open Garden's shared supporter count."
              : "Rejected. The input did not satisfy the rule, so Open Garden's state did not change."}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={reset}
        className="inline-flex cursor-pointer items-center gap-1 self-start font-mono text-xs text-dark-text-muted hover:text-dark-text"
      >
        <ArrowPathIcon className="h-3.5 w-3.5" />
        reset example
      </button>
    </div>
  );
};
