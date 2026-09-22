"use client";

import { useEffect, useState } from "react";
import { useLabStore } from "~~/services/store/lab-store";

type Phase = "idle" | "running" | "cracked" | "stopped";
type Round = { target: string; start: bigint; guess: string; guesses: number; phase: Phase };

const GUESSES_PER_SECOND = 8;
const ROLL_MS = 1000 / GUESSES_PER_SECOND;
const MAX_LENGTH = 64;
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

const randomValue = (length: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
};

const newRound = (length: number): Round => ({
  target: randomValue(length),
  start: BigInt(`0x${randomValue(length)}`),
  guess: "",
  guesses: 0,
  phase: "idle",
});

// The single-character example visits every value so it always finishes quickly.
const guessAt = (start: bigint, attempt: number, length: number) =>
  ((start + BigInt(attempt - 1)) % 16n ** BigInt(length)).toString(16).padStart(length, "0");

const createGuessPicker = (length: number) => {
  const tried = new Set<string>();
  const possibilities = 16n ** BigInt(length);
  return () => {
    if (BigInt(tried.size) === possibilities) return null;
    let guess = randomValue(length);
    // Skip collisions without an unbounded random retry loop near exhaustion.
    while (tried.has(guess)) {
      guess = ((BigInt(`0x${guess}`) + 1n) % possibilities).toString(16).padStart(length, "0");
    }
    tried.add(guess);
    return guess;
  };
};

// A key rendered char-by-char against its counterpart: matches light up mint
// and the 0x prefix stays grey. Misses go orange on the guess string; on the
// target they keep the default text color (missClass="").
const MatchedHex = ({
  value,
  target,
  missClass = "text-peach-bright",
}: {
  value: string;
  target: string;
  missClass?: string;
}) => (
  <span className="break-all">
    <span className="text-dark-text-muted">0x</span>
    {value.split("").map((ch, i) => (
      <span key={i} className={ch === target[i] ? "text-mint-bright" : missClass || undefined}>
        {ch}
      </span>
    ))}
  </span>
);

const averageTime = (length: number) => {
  const expectedGuesses = (16 ** length + 1) / 2;
  const seconds = expectedGuesses / GUESSES_PER_SECOND;
  if (seconds < 60) return `${seconds.toLocaleString("en-US", { maximumFractionDigits: 1 })} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toLocaleString("en-US", { maximumFractionDigits: 1 })} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toLocaleString("en-US", { maximumFractionDigits: 1 })} hours`;
  if (seconds < SECONDS_PER_YEAR)
    return `${(seconds / 86400).toLocaleString("en-US", { maximumFractionDigits: 1 })} days`;
  const years = seconds / SECONDS_PER_YEAR;
  return `${years < 1000000 ? years.toLocaleString("en-US", { maximumFractionDigits: 1 }) : years.toExponential(2)} years`;
};

export const BruteForce = () => {
  const setInteractiveOpen = useLabStore(state => state.setInteractiveOpen);
  const [length, setLength] = useState(1);
  const [multiCharacterRuns, setMultiCharacterRuns] = useState(0);
  const [round, setRound] = useState<Round>({ target: "", start: 0n, guess: "", guesses: 0, phase: "idle" });

  useEffect(() => setRound(newRound(1)), []);

  useEffect(() => {
    if (round.phase !== "running") return;
    const pickGuess = createGuessPicker(length);
    const timer = setInterval(() => {
      const randomGuess = length > 1 ? pickGuess() : "";
      if (randomGuess === null) return;
      setRound(current => {
        if (current.phase !== "running") return current;
        const guesses = current.guesses + 1;
        const guess = length === 1 ? guessAt(current.start, guesses, length) : randomGuess;
        const cracked = guess === current.target;
        return { ...current, guess, guesses, phase: cracked ? "cracked" : "running" };
      });
    }, ROLL_MS);
    return () => clearInterval(timer);
  }, [round.phase, length]);

  const changeLength = (value: number) => {
    setLength(value);
    setRound(newRound(value));
  };
  const guess = round.guess;
  const matches = guess.split("").filter((character, index) => character === round.target[index]).length;
  const possibilities = 16n ** BigInt(length);
  const running = round.phase === "running";

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-dark-border px-3 py-1 font-mono text-xs">
          guesses <strong>{round.guesses.toLocaleString("en-US")}</strong>
        </span>
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setRound(newRound(length))}>
          <span className="normal-case">Reset</span>
        </button>
      </div>

      <label className="flex flex-col gap-3 text-sm">
        <span>
          Key length:{" "}
          <strong>
            {length} {length === 1 ? "character" : "characters"}
          </strong>
        </span>
        <input
          type="range"
          min={1}
          max={MAX_LENGTH}
          step={1}
          value={length}
          onChange={event => changeLength(Number(event.target.value))}
          className="range range-primary range-sm w-full"
          aria-label="Key length"
          aria-valuetext={`${length} hexadecimal characters`}
        />
      </label>
      <div className="flex justify-between text-xs text-dark-text-muted">
        <span>1 character</span>
        <span>64 characters · full-length key</span>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-dark-border bg-lab-code-panel-tint p-3 font-mono text-xs">
        <span className="text-dark-text-muted">
          target key ·{" "}
          {length <= 8 ? (
            possibilities.toLocaleString("en-US")
          ) : (
            <>
              2<sup>{length * 4}</sup>
            </>
          )}{" "}
          possibilities
        </span>
        <div className="break-all rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 text-sm">
          {round.target ? <MatchedHex value={round.target} target={guess} missClass="" /> : "…"}
        </div>
        <span className="text-dark-text-muted">current guess</span>
        <div className="break-all rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 text-sm">
          {guess ? <MatchedHex value={guess} target={round.target} /> : "—"}
        </div>
        <span className="text-dark-text-muted">
          {matches} of {length} characters match
        </span>
      </div>

      <p aria-live="polite" className="m-0 text-sm leading-relaxed text-dark-text-muted">
        {round.phase === "idle" &&
          length < MAX_LENGTH &&
          "Choose a key length, then press Go. This demo tries eight guesses per second."}
        {running && "Trying eight guesses per second. Matching some characters isn’t enough—the entire key must match."}
        {round.phase === "cracked" &&
          `Cracked in ${round.guesses} ${round.guesses === 1 ? "guess" : "guesses"}! Add a character and see how much larger the search becomes.`}
        {round.phase === "stopped" &&
          `Stopped after ${round.guesses.toLocaleString("en-US")} guesses.${length < MAX_LENGTH ? " Try the full-length key to see how long that would take." : ""}`}
      </p>
      <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
        {running && length > 1 && multiCharacterRuns === 1 && "Each guess is tried only once per run. "}
        Each extra hexadecimal character multiplies the possibilities by 16. At eight guesses per second, finding this
        key would take about <strong className="text-dark-text">{averageTime(length)}</strong> on average.
        {length === MAX_LENGTH && " That’s why guessing a properly generated private key is impractical."}
      </p>

      <div className="flex flex-wrap gap-2.5">
        {running ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setRound(current => ({ ...current, phase: "stopped" }))}
          >
            <span className="normal-case">Stop</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!round.target}
            onClick={() => {
              if (length > 1) setMultiCharacterRuns(count => count + 1);
              setRound({ ...(round.phase === "idle" ? round : newRound(length)), phase: "running" });
            }}
          >
            <span className="normal-case">{round.phase === "idle" ? "Go" : "Try again"}</span>
          </button>
        )}
        {length === MAX_LENGTH && round.phase === "stopped" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setInteractiveOpen(false)}>
            <span className="normal-case">Done</span>
          </button>
        )}
        {length < MAX_LENGTH && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => changeLength(length + 1)}>
            <span className="normal-case">Add a character</span>
          </button>
        )}
        {length < MAX_LENGTH && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => changeLength(MAX_LENGTH)}>
            <span className="normal-case">Try a full-length key</span>
          </button>
        )}
      </div>
    </div>
  );
};
