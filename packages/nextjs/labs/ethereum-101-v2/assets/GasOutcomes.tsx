"use client";

import { useState } from "react";

type Scenario = {
  title: string;
  setup: string;
  paysGas: boolean;
  payment: string;
  gas: string;
  explanation: string;
};

const STAGES = [
  { label: "Wallet", caseIndex: 0 },
  { label: "Node validation", caseIndex: 1 },
  { label: "Included in block", caseIndex: null },
  { label: "Execution result", caseIndex: 2 },
] as const;

const SCENARIOS: Scenario[] = [
  {
    title: "Wallet blocks it",
    setup: "Your wallet sees that the account cannot cover the amount and refuses to broadcast.",
    paysGas: false,
    payment: "Never left the wallet",
    gas: "0 ETH",
    explanation: "It never reached a block, so no gas was charged.",
  },
  {
    title: "Network rejects it",
    setup: "The wallet broadcasts, but network checks reject an invalid transaction before any block includes it.",
    paysGas: false,
    payment: "Transfer never executed",
    gas: "0 ETH",
    explanation: "Broadcasting alone does not charge gas; inclusion does.",
  },
  {
    title: "Another contribution gets there first",
    setup:
      "The fundraiser can accept only 0.5 ETH more. Two people each contribute 0.5 ETH before either transaction is confirmed. The network orders one first, filling the cap. The second is included next, but the contract sees that the fundraiser is full and reverts it.",
    paysGas: true,
    payment: "Contribution reverted",
    gas: "0.0002 ETH spent",
    explanation:
      "The contribution reverted, but the included transaction still used computation and block space, so gas was spent.",
  },
];

export const GasOutcomes = () => {
  const [index, setIndex] = useState(0);
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [results, setResults] = useState<Array<boolean | null>>(() => SCENARIOS.map(() => null));
  const scenario = SCENARIOS[index];
  const answered = prediction !== null;
  const last = index === SCENARIOS.length - 1;
  const finished = last && answered;
  const score = results.filter(result => result === true).length;

  const choose = (value: boolean) => {
    if (answered) return;
    setPrediction(value);
    setResults(current =>
      current.map((result, resultIndex) => (resultIndex === index ? value === scenario.paysGas : result)),
    );
  };

  const reset = () => {
    setIndex(0);
    setPrediction(null);
    setResults(SCENARIOS.map(() => null));
  };

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-dark-text-muted">
          gas lab · case {index + 1}/{SCENARIOS.length}
        </span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <p className="m-0 text-sm leading-relaxed text-dark-text-muted">Read each case and decide whether gas is paid.</p>

      <div className="rounded-xl border border-dark-border bg-dark-surface p-4">
        <span className="text-sm font-semibold text-dark-text">{scenario.title}</span>
        <p className="mb-0 mt-2 text-sm leading-relaxed text-dark-text-muted">{scenario.setup}</p>
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-surface p-3">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-dark-text-muted">Transaction path</p>

        <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STAGES.map((stage, stageIndex) => {
            const disabled = stage.caseIndex === null;
            const result = disabled ? null : results[stage.caseIndex];
            const active = stage.caseIndex === index && result === null;
            const status = disabled
              ? "No question"
              : result === true
                ? "Correct"
                : result === false
                  ? "Incorrect"
                  : active
                    ? "Current case"
                    : "Pending";

            const stageClass = disabled
              ? "border-dashed border-dark-border/80 bg-dark-bg/40 text-dark-text-faint"
              : result === true
                ? "border-mint-bright/50 bg-mint-bright/10 text-mint-bright"
                : result === false
                  ? "border-peach-bright/50 bg-peach-bright/10 text-peach-bright"
                  : active
                    ? "border-violet-bright/50 bg-dark-bg text-dark-text"
                    : "border-dark-border bg-dark-bg text-dark-text-muted";

            return (
              <li
                key={stage.label}
                aria-current={active ? "step" : undefined}
                aria-label={`${stage.label}: ${disabled ? "gas boundary, no question" : status}`}
                className={`min-w-0 rounded-lg border px-2 py-2.5 transition-colors ${stageClass}`}
                style={
                  disabled
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(135deg, transparent 0, transparent 6px, rgba(148, 163, 184, 0.08) 6px, rgba(148, 163, 184, 0.08) 8px)",
                      }
                    : undefined
                }
              >
                <span className="block font-mono text-[10px] opacity-70">0{stageIndex + 1}</span>
                <span className="mt-1 block text-xs font-semibold leading-tight">{stage.label}</span>
                <span
                  className={`mt-1 block text-[11px] leading-tight ${active ? "invisible" : ""}`}
                  aria-hidden={active}
                >
                  {active ? "Current case" : status}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        <p className="mb-2 mt-0 text-xs font-semibold uppercase tracking-wide text-dark-text-muted">Is gas paid?</p>
        <div className="grid grid-cols-2 gap-2">
          {[false, true].map(value => (
            <button
              key={String(value)}
              type="button"
              onClick={() => choose(value)}
              disabled={answered}
              aria-label={
                answered
                  ? `${value ? "Yes, gas is paid" : "No gas is paid"}. ${
                      value === scenario.paysGas
                        ? "Correct answer"
                        : value === prediction
                          ? "Your answer, incorrect"
                          : ""
                    }`
                  : value
                    ? "Yes, gas is paid"
                    : "No gas is paid"
              }
              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-default ${
                answered && value === scenario.paysGas
                  ? "border-mint-bright bg-mint-bright/10 text-mint-bright"
                  : answered && value === prediction
                    ? "border-peach-bright bg-peach-bright/10 text-peach-bright"
                    : "border-dark-border bg-dark-bg text-dark-text-muted hover:border-violet-bright"
              }`}
            >
              {value ? "Yes, gas is paid" : "No gas is paid"}
            </button>
          ))}
        </div>
      </div>

      {answered && (
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="rounded-lg border border-dark-border bg-dark-surface p-3 text-sm leading-relaxed">
            <strong className={prediction === scenario.paysGas ? "text-mint-bright" : "text-peach-bright"}>
              {prediction === scenario.paysGas ? "Correct." : "Incorrect."}
            </strong>{" "}
            <span className="text-dark-text-muted">{scenario.explanation}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-dark-border bg-dark-bg p-3">
              <span className="block text-dark-text-faint">Payment</span>
              <strong className="mt-1 block font-mono text-dark-text">{scenario.payment}</strong>
            </div>
            <div className="rounded-lg border border-dark-border bg-dark-bg p-3">
              <span className="block text-dark-text-faint">Gas</span>
              <strong className="mt-1 block font-mono text-dark-text">{scenario.gas}</strong>
            </div>
          </div>
        </div>
      )}

      {answered && !last && (
        <button
          type="button"
          onClick={() => {
            setIndex(current => current + 1);
            setPrediction(null);
          }}
          className="cursor-pointer rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] hover:opacity-90"
        >
          Next case
        </button>
      )}

      {finished && (
        <div className="rounded-xl border border-mint-bright/30 bg-mint-bright/10 p-4 text-sm leading-relaxed text-dark-text-muted">
          <strong className="text-dark-text">
            Gas lab complete · {score}/{SCENARIOS.length}
          </strong>
          <p className="mb-0 mt-3">The key question is not “did it succeed?” but “was it included and executed?”</p>
        </div>
      )}
    </div>
  );
};
