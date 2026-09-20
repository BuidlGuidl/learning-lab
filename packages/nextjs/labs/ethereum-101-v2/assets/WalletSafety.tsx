"use client";

// A tiny "what is safe to share?" decision for the Wallets chapter. The learner
// picks one of three things a stranger might ask for and sees why it is safe or
// not. Persona-neutral: no story context required beyond the card it sits on.
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
    label: "Your public address: 0x71C2…F3a9",
    detail: "Safe to share. Your address is how people send you ETH — though remember everything it does is public.",
    safe: true,
  },
  {
    id: "recovery",
    label: "Your recovery phrase",
    detail: "Never share it. It can regenerate your private key and hand over complete control of your account.",
    safe: false,
  },
  {
    id: "blind-signature",
    label: "An unclear “Approve transfer” request",
    detail:
      "Reject it. A signature never reveals your key, but it can still authorize an action you did not intend. If a request is unclear, refuse it and investigate.",
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
          <p className="m-0 text-sm font-semibold text-dark-text">Which one is safe to share?</p>
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
        {selected ? selected.detail : "Your wallet guards your key, but it still relies on you to judge every request."}
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
