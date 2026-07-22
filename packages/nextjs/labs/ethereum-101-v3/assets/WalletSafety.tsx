"use client";

import { useState } from "react";
import { CheckCircleIcon, KeyIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

type Choice = {
  id: string;
  label: string;
  detail: string;
  safe: boolean;
};

const choices: Choice[] = [
  {
    id: "address",
    label: "Alex's public address: 0x71C2…F3a9",
    detail: "Correct. Alex can share the address, although the activity associated with it is public.",
    safe: true,
  },
  {
    id: "recovery",
    label: "Your recovery phrase",
    detail: "Never share it. It can grant complete control over the accounts derived from it.",
    safe: false,
  },
  {
    id: "blind-signature",
    label: "An unclear ‘Support Open Garden’ request",
    detail: "Reject it. A signature can authorize an action even though it does not reveal your secret key.",
    safe: false,
  },
];

export const WalletSafety = () => {
  const [selected, setSelected] = useState<Choice | null>(null);

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center gap-3 rounded-xl border border-dark-border bg-lab-code-panel-tint p-3">
        <KeyIcon className="h-7 w-7 shrink-0 text-violet-bright" />
        <div>
          <p className="m-0 text-sm font-semibold text-dark-text">Which choice is safe for Alex?</p>
          <p className="m-0 mt-0.5 text-xs text-dark-text-muted">Choose before revealing the explanation.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {choices.map(choice => {
          const active = selected?.id === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelected(choice)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                active
                  ? choice.safe
                    ? "border-lab-mint bg-lab-mint/10 text-dark-text"
                    : "border-error/70 bg-error/10 text-dark-text"
                  : "border-dark-border bg-dark-surface text-dark-text-muted hover:border-violet-bright hover:text-dark-text"
              }`}
            >
              <span>{choice.label}</span>
              {active &&
                (choice.safe ? (
                  <CheckCircleIcon className="h-5 w-5 shrink-0 text-lab-mint" />
                ) : (
                  <ShieldExclamationIcon className="h-5 w-5 shrink-0 text-error" />
                ))}
            </button>
          );
        })}
      </div>

      <div
        className={`min-h-[5.25rem] rounded-xl border px-4 py-3 text-sm leading-relaxed ${
          selected
            ? selected.safe
              ? "border-lab-mint/50 bg-lab-mint/5 text-dark-text"
              : "border-error/40 bg-error/5 text-dark-text"
            : "border-dark-border bg-dark-bg/40 text-dark-text-muted"
        }`}
      >
        {selected
          ? selected.detail
          : "Your wallet protects authorization, but it still relies on you to judge requests."}
      </div>

      {selected && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="self-start font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          try again
        </button>
      )}
    </div>
  );
};
