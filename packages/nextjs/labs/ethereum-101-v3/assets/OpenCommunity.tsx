"use client";

import { useState } from "react";
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, FingerPrintIcon, WalletIcon } from "@heroicons/react/24/outline";

type AppId = "commons" | "signal";
type Phase = "ready" | "signed" | "pending" | "confirmed";

const appNames: Record<AppId, string> = {
  commons: "Commons",
  signal: "Signal Garden",
};

const phaseCopy: Record<Phase, string> = {
  ready: "Both apps recognize Alex's address. Start by asking the wallet to support Mina's project.",
  signed: "Your wallet signed the exact request. The private key stayed secret.",
  pending: "The signed request is in the pending pool. The shared state has not changed yet.",
  confirmed: "Confirmed. The shared supporter count and treasury now appear in both applications.",
};

export const OpenCommunity = () => {
  const [app, setApp] = useState<AppId>("commons");
  const [phase, setPhase] = useState<Phase>("ready");

  const confirmed = phase === "confirmed";
  const supporters = confirmed ? 129 : 128;
  const treasury = confirmed ? "4.21" : "4.20";

  const advance = () => {
    setPhase(current => {
      if (current === "ready") return "signed";
      if (current === "signed") return "pending";
      if (current === "pending") return "confirmed";
      return "ready";
    });
  };

  const actionLabel =
    phase === "ready"
      ? "Ask wallet to support"
      : phase === "signed"
        ? "Broadcast transaction"
        : phase === "pending"
          ? "Include and confirm"
          : "Run again";

  const PhaseIcon =
    phase === "ready"
      ? WalletIcon
      : phase === "signed"
        ? FingerPrintIcon
        : phase === "pending"
          ? ClockIcon
          : CheckCircleIcon;

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Choose an application">
          {(Object.keys(appNames) as AppId[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => setApp(id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                app === id
                  ? "border-violet-bright bg-lab-code-panel-tint text-dark-text"
                  : "border-dark-border text-dark-text-muted hover:border-violet-bright"
              }`}
            >
              {appNames[id]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPhase("ready")}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="flex items-center justify-between gap-3 border-b border-dark-border px-4 py-3">
          <div>
            <p className="m-0 text-sm font-semibold text-dark-text">{appNames[app]}</p>
            <p className="m-0 text-xs text-dark-text-muted">interface for the Open Garden project</p>
          </div>
          <span className="rounded-full border border-dark-border bg-dark-bg px-2 py-1 font-mono text-[10px] text-dark-text-muted">
            Alex · 0x71C2…F3a9
          </span>
        </div>

        <div className="p-4">
          <div className="mb-4 rounded-xl border border-dark-border bg-dark-bg/60 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="m-0 font-semibold text-dark-text">Open Garden</p>
                <p className="m-0 mt-1 text-xs leading-relaxed text-dark-text-muted">
                  Mina&apos;s community-funded tools for healthier public spaces.
                </p>
              </div>
              {confirmed && <CheckCircleIcon className="h-5 w-5 shrink-0 text-lab-mint" />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-dark-border px-3 py-2">
                <p className="m-0 font-mono text-lg font-semibold text-dark-text">{supporters}</p>
                <p className="m-0 text-[10px] uppercase tracking-wide text-dark-text-muted">supporters</p>
              </div>
              <div className="rounded-lg border border-dark-border px-3 py-2">
                <p className="m-0 font-mono text-lg font-semibold text-dark-text">{treasury} ETH</p>
                <p className="m-0 text-[10px] uppercase tracking-wide text-dark-text-muted">shared treasury</p>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
              confirmed
                ? "border-lab-mint/50 bg-lab-mint/5"
                : phase === "pending"
                  ? "border-warning/50 bg-warning/5"
                  : "border-dark-border bg-lab-code-panel-tint"
            }`}
          >
            <PhaseIcon
              className={`h-6 w-6 shrink-0 ${
                confirmed ? "text-lab-mint" : phase === "pending" ? "text-warning" : "text-violet-bright"
              }`}
            />
            <p className="m-0 text-sm leading-relaxed text-dark-text-muted">{phaseCopy[phase]}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={advance}
        className="btn btn-sm self-start border-0 bg-violet-bright text-[#1a102c] hover:bg-violet-bright/90"
      >
        {phase === "confirmed" && <ArrowPathIcon className="h-4 w-4" />}
        {actionLabel}
      </button>

      <p className="m-0 text-xs leading-relaxed text-dark-text-muted">
        Switch apps at any phase. The interface changes, but the account and confirmed network state are shared.
      </p>
    </div>
  );
};
