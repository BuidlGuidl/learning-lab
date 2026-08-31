"use client";

import { useState } from "react";

// Gas lab, three short phases that match the three ideas of the Gas card:
//   1. bigger actions cost more (not bigger amounts)  → order four actions
//   2. the price floats with network activity          → drag a slider
//   3. you pay even when the action fails               → predict, then reveal
// Rejected-before-a-block is TransactionJourney's job; this lab starts after it.

type Action = {
  id: string;
  label: string;
  work: number; // relative units of network work
  note: string;
};

const ACTIONS: Action[] = [
  {
    id: "send-small",
    label: "Send 0.01 ETH to a friend",
    work: 1,
    note: "A plain transfer: the smallest job there is.",
  },
  {
    id: "send-big",
    label: "Send 10 ETH to a friend",
    work: 1,
    note: "Same job as sending 0.01 ETH. A bigger amount is not more work.",
  },
  {
    id: "buy-item",
    label: "Buy an item in a game",
    work: 3,
    note: "The network runs a smart contract's rules: check the price, update the stock, hand you the item.",
  },
  {
    id: "deploy",
    label: "Put a new vending machine on the network",
    work: 12,
    note: "Storing a whole program so every node keeps a copy is the heaviest job on this list.",
  },
];

const CORRECT_ORDER_BY_WORK = [...ACTIONS].sort((a, b) => a.work - b.work);
const MAX_WORK = Math.max(...ACTIONS.map(action => action.work));

// Shown as a bar height, not a currency: dollar figures age, ratios don't.
const congestionMultiplier = (activity: number) => 1 + (activity / 100) ** 2 * 9;

const REVERT_CASE = {
  setup:
    "A fundraiser can accept only 0.5 ETH more. You and another person each send 0.5 ETH at almost the same moment. The network carries out theirs first, and the fundraiser is full. Then it carries out yours: the smart contract sees there is no room left and undoes your contribution.",
  payment: "Never went through",
  gas: "0.0002 ETH spent",
  explanation:
    "Your transaction was valid, so the network carried it out. Thousands of machines ran the contract's rules before the contract said no. That work is what gas pays for, and it was done.",
} as const;

const PATH_STAGES = ["Wallet signs", "Network checks", "Carried out", "Result"] as const;

const isCorrectPosition = (actionId: string, position: number) =>
  ACTIONS.find(action => action.id === actionId)?.work === CORRECT_ORDER_BY_WORK[position].work;

// An order is right when each slot holds an action with the right amount of work
// (the two sends tie, so either may go first).
const orderIsCorrect = (order: string[]) =>
  order.every(
    (id, position) => ACTIONS.find(action => action.id === id)?.work === CORRECT_ORDER_BY_WORK[position].work,
  );

export const GasOutcomes = () => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  // Phase 1
  const [order, setOrder] = useState<string[]>([]);
  const [orderChecked, setOrderChecked] = useState(false);

  // Phase 2
  const [activity, setActivity] = useState(15);
  const [sliderTouched, setSliderTouched] = useState(false);

  // Phase 3
  const [prediction, setPrediction] = useState<boolean | null>(null);

  const reset = () => {
    setPhase(0);
    setOrder([]);
    setOrderChecked(false);
    setActivity(15);
    setSliderTouched(false);
    setPrediction(null);
  };

  const pick = (id: string) => {
    if (orderChecked || order.includes(id)) return;
    setOrder(current => [...current, id]);
  };

  const unpick = (id: string) => {
    if (orderChecked) return;
    setOrder(current => current.filter(item => item !== id));
  };

  const orderComplete = order.length === ACTIONS.length;
  const orderRight = orderChecked && orderIsCorrect(order);
  const multiplier = congestionMultiplier(activity);
  const answered = prediction !== null;

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-dark-text-muted">gas lab · {phase + 1}/3</span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <ol className="grid grid-cols-3 gap-2" aria-label="Gas lab phases">
        {["What costs more?", "Busy vs quiet", "It failed. Gas?"].map((label, i) => (
          <li
            key={label}
            aria-current={phase === i ? "step" : undefined}
            className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-colors ${
              phase === i
                ? "border-violet-bright/60 bg-violet-bright/15 text-dark-text"
                : phase > i
                  ? "border-mint-bright/30 bg-mint-bright/10 text-mint-bright"
                  : "border-dark-border bg-dark-bg text-dark-text-faint"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      {/* ───────────── Phase 1: order the actions ───────────── */}
      {phase === 0 && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
            Four things you could ask the network to do. Tap them from{" "}
            <strong className="text-dark-text">cheapest</strong> to{" "}
            <strong className="text-dark-text">most expensive</strong> in gas.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIONS.map(action => {
              const position = order.indexOf(action.id);
              const picked = position !== -1;
              const rightHere = orderChecked && picked && isCorrectPosition(action.id, position);
              const wrongHere = orderChecked && picked && !orderIsCorrect(order) && !rightHere;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => (picked ? unpick(action.id) : pick(action.id))}
                  disabled={orderChecked}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${
                    rightHere
                      ? "border-mint-bright/50 bg-mint-bright/10 text-dark-text"
                      : wrongHere
                        ? "border-peach-bright/50 bg-peach-bright/10 text-dark-text"
                        : picked
                          ? "border-violet-bright/60 bg-violet-bright/15 text-dark-text"
                          : "border-dark-border bg-dark-bg text-dark-text-muted hover:border-violet-bright"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${
                      picked ? "border-violet-bright text-violet-bright" : "border-dark-border text-dark-text-faint"
                    }`}
                  >
                    {picked ? position + 1 : "·"}
                  </span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {!orderChecked && (
            <button
              type="button"
              disabled={!orderComplete}
              onClick={() => setOrderChecked(true)}
              className="cursor-pointer rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] hover:opacity-90 disabled:cursor-default disabled:opacity-40"
            >
              {orderComplete ? "Check my order" : `Pick ${ACTIONS.length - order.length} more`}
            </button>
          )}

          {orderChecked && (
            <div className="flex flex-col gap-3" aria-live="polite">
              <div className="rounded-lg border border-dark-border bg-dark-surface p-3 text-sm leading-relaxed">
                <strong className={orderRight ? "text-mint-bright" : "text-peach-bright"}>
                  {orderRight ? "Right order." : "Not quite."}
                </strong>{" "}
                <span className="text-dark-text-muted">
                  Gas measures the <strong className="text-dark-text">work</strong> the network does, not the amount of
                  ETH involved. Sending 10 ETH is exactly the same job as sending 0.01 ETH.
                </span>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-bg p-3">
                <span className="block text-xs font-semibold uppercase tracking-wide text-dark-text-faint">
                  Relative gas
                </span>
                <ul className="mt-3 flex flex-col gap-2">
                  {CORRECT_ORDER_BY_WORK.map(action => (
                    <li key={action.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-dark-text">{action.label}</span>
                        <span className="font-mono text-dark-text-faint">×{action.work}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-dark-border">
                        <div
                          className="h-full rounded-full bg-violet-bright transition-[width] duration-500"
                          style={{ width: `${(action.work / MAX_WORK) * 100}%` }}
                        />
                      </div>
                      <p className="mb-0 mt-1 text-[11px] leading-snug text-dark-text-muted">{action.note}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setPhase(1)}
                className="cursor-pointer rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] hover:opacity-90"
              >
                Next: busy vs quiet
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────── Phase 2: network activity slider ───────────── */}
      {phase === 1 && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
            Same job: sending 0.01 ETH. The only thing that changes is how many other people want the network right now.
            Drag the slider.
          </p>

          <div className="rounded-lg border border-dark-border bg-dark-surface p-4">
            <div className="flex items-center justify-between text-xs text-dark-text-faint">
              <span>quiet</span>
              <span className="font-semibold text-dark-text">network activity</span>
              <span>busy</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={activity}
              onChange={event => {
                setActivity(Number(event.target.value));
                setSliderTouched(true);
              }}
              aria-label="Network activity, from quiet to busy"
              className="range range-xs mt-3 w-full"
            />

            <div className="mt-4 flex items-end gap-4">
              <div className="flex h-28 w-10 items-end overflow-hidden rounded-lg bg-dark-bg">
                <div
                  className="w-full rounded-t-lg bg-violet-bright transition-[height] duration-200"
                  style={{ height: `${(multiplier / 10) * 100}%` }}
                />
              </div>
              <div className="text-sm leading-relaxed text-dark-text-muted">
                <span className="block font-mono text-2xl font-semibold text-dark-text">×{multiplier.toFixed(1)}</span>
                <span className="block text-xs">the fee for the same transfer, compared with an empty network</span>
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg border border-dark-border bg-dark-bg p-3 text-sm leading-relaxed text-dark-text-muted transition-opacity ${
              sliderTouched ? "opacity-100" : "opacity-50"
            }`}
            aria-live="polite"
          >
            {activity < 35 && "Quiet network: plenty of room, so the fee sits near pocket change."}
            {activity >= 35 &&
              activity < 75 &&
              "Busier now. Every block has limited room, and more people want a spot in it."}
            {activity >= 75 &&
              "Rush hour. Your job hasn't changed at all; you're paying more to get it done ahead of everyone else who wants the same room. There is no ceiling: it depends only on how busy the network is."}
          </div>

          <p className="m-0 text-xs leading-relaxed text-dark-text-faint">
            Two dials, then: <strong className="text-dark-text-muted">what</strong> you ask for sets the work;{" "}
            <strong className="text-dark-text-muted">when</strong> you ask sets the price of that work.
          </p>

          <button
            type="button"
            onClick={() => setPhase(2)}
            disabled={!sliderTouched}
            className="cursor-pointer rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] hover:opacity-90 disabled:cursor-default disabled:opacity-40"
          >
            Next: it failed. Gas?
          </button>
        </div>
      )}

      {/* ───────────── Phase 3: the revert ───────────── */}
      {phase === 2 && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
            You already saw that a transaction the network refuses never reaches a block and costs nothing. Now a
            trickier one.
          </p>

          <div className="rounded-xl border border-dark-border bg-dark-surface p-4">
            <span className="text-sm font-semibold text-dark-text">Someone gets there first</span>
            <p className="mb-0 mt-2 text-sm leading-relaxed text-dark-text-muted">{REVERT_CASE.setup}</p>
          </div>

          <div>
            <p className="mb-2 mt-0 text-xs font-semibold uppercase tracking-wide text-dark-text-muted">
              Your 0.5 ETH is back in your account. Did you pay gas?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map(value => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => !answered && setPrediction(value)}
                  disabled={answered}
                  aria-label={
                    answered
                      ? `${value ? "Yes, gas is paid" : "No gas is paid"}. ${
                          value ? "Correct answer" : value === prediction ? "Your answer, incorrect" : ""
                        }`
                      : value
                        ? "Yes, gas is paid"
                        : "No gas is paid"
                  }
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:cursor-default ${
                    answered && value
                      ? "border-mint-bright bg-mint-bright/10 text-mint-bright"
                      : answered && value === prediction
                        ? "border-peach-bright bg-peach-bright/10 text-peach-bright"
                        : "border-dark-border bg-dark-bg text-dark-text-muted hover:border-violet-bright"
                  }`}
                >
                  {value ? "Yes, gas was paid" : "No, nothing was paid"}
                </button>
              ))}
            </div>
          </div>

          {answered && (
            <div className="flex flex-col gap-3" aria-live="polite">
              <div className="rounded-lg border border-dark-border bg-dark-surface p-3 text-sm leading-relaxed">
                <strong className={prediction ? "text-mint-bright" : "text-peach-bright"}>
                  {prediction ? "Correct." : "Not this time."}
                </strong>{" "}
                <span className="text-dark-text-muted">{REVERT_CASE.explanation}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-dark-border bg-dark-bg p-3">
                  <span className="block text-dark-text-faint">Your contribution</span>
                  <strong className="mt-1 block font-mono text-dark-text">{REVERT_CASE.payment}</strong>
                </div>
                <div className="rounded-lg border border-dark-border bg-dark-bg p-3">
                  <span className="block text-dark-text-faint">Gas</span>
                  <strong className="mt-1 block font-mono text-dark-text">{REVERT_CASE.gas}</strong>
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-bg p-3">
                <span className="block text-xs font-semibold uppercase tracking-wide text-dark-text-faint">
                  Where your transaction got to
                </span>
                <ol className="mt-3 grid grid-cols-4 gap-2">
                  {PATH_STAGES.map((stage, i) => {
                    const reached = true;
                    const lastStage = i === PATH_STAGES.length - 1;
                    return (
                      <li
                        key={stage}
                        className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold leading-tight ${
                          lastStage
                            ? "border-peach-bright/50 bg-peach-bright/10 text-peach-bright"
                            : reached
                              ? "border-mint-bright/30 bg-mint-bright/10 text-mint-bright"
                              : "border-dark-border text-dark-text-faint"
                        }`}
                      >
                        <span className="block font-mono text-[10px] opacity-70">0{i + 1}</span>
                        <span className="mt-1 block">{stage}</span>
                        {lastStage && <span className="mt-1 block font-normal opacity-80">contract said no</span>}
                      </li>
                    );
                  })}
                </ol>
                <p className="mb-0 mt-3 text-xs leading-relaxed text-dark-text-muted">
                  Gas is charged from step 03 onwards. A transaction that stops at 02 pays nothing; one that reaches 03
                  pays for the work, whatever the result at 04.
                </p>
              </div>

              <div className="rounded-xl border border-mint-bright/30 bg-mint-bright/10 p-4 text-sm leading-relaxed text-dark-text-muted">
                <strong className="text-dark-text">Gas lab complete</strong>
                <p className="mb-0 mt-3">
                  The question is never “did it succeed?” but “did the network carry it out?” That&apos;s why reading a
                  transaction before you sign it matters: you pay for the work either way.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
