"use client";

import { useEffect, useState } from "react";
import { useLabStore } from "~~/services/store/lab-store";

type Phase = "idle" | "running" | "cracked" | "stopped";
type Round = { target: string; start: bigint; guess: string; guesses: number; phase: Phase };

const GUESSES_PER_SECOND = 8;
const ROLL_MS = 1000 / GUESSES_PER_SECOND;
const MAX_LENGTH = 64;
const GIVE_UP_DELAY_SECONDS = 8;
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
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCrackedSingleCharacter, setHasCrackedSingleCharacter] = useState(false);
  const [hasAttemptedTwoCharacters, setHasAttemptedTwoCharacters] = useState(false);
  const [hasIncreasedLength, setHasIncreasedLength] = useState(false);
  const [showLengthHint, setShowLengthHint] = useState(false);
  const [giveUpSecondsLeft, setGiveUpSecondsLeft] = useState(0);
  const [round, setRound] = useState<Round>({ target: "", start: 0n, guess: "", guesses: 0, phase: "idle" });

  useEffect(() => setRound(newRound(1)), []);

  useEffect(() => {
    if (length === 1 && round.phase === "cracked") setHasCrackedSingleCharacter(true);
  }, [length, round.phase]);

  useEffect(() => {
    if (length === 2 && round.guesses > 0 && (round.phase === "cracked" || round.phase === "stopped")) {
      setHasAttemptedTwoCharacters(true);
    }
  }, [length, round.phase, round.guesses]);

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

  useEffect(() => {
    if (length !== MAX_LENGTH || round.phase !== "running") return;
    const deadline = performance.now() + GIVE_UP_DELAY_SECONDS * 1000;
    const timer = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      setGiveUpSecondsLeft(secondsLeft);
      if (secondsLeft === 0) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [length, round.phase]);

  const changeLength = (value: number) => {
    setShowLengthHint(value > length && !hasIncreasedLength);
    if (value > length) setHasIncreasedLength(true);
    setLength(value);
    setRound(newRound(value));
  };
  const guess = round.guess;
  const matches = guess.split("").filter((character, index) => character === round.target[index]).length;
  const possibilities = 16n ** BigInt(length);
  const running = round.phase === "running";

  return (
    <div
      className="flex flex-col gap-4 text-dark-text"
      style={{
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">guesses</span>
          <strong className="font-semibold text-dark-text">{round.guesses.toLocaleString("en-US")}</strong>
        </span>
        <button
          type="button"
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
          onClick={() => {
            setLength(1);
            setRound(newRound(1));
            setMultiCharacterRuns(0);
            setHasStarted(false);
            setHasCrackedSingleCharacter(false);
            setHasAttemptedTwoCharacters(false);
            setHasIncreasedLength(false);
            setShowLengthHint(false);
            setGiveUpSecondsLeft(0);
          }}
        >
          Reset
        </button>
      </div>

      <p className="m-0 text-sm">
        Key length:{" "}
        <strong>
          {length} {length === 1 ? "character" : "characters"}
        </strong>
        {length === MAX_LENGTH && " · full-length key"}
      </p>

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
        <div
          className={`break-all rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 ${length === MAX_LENGTH ? "text-xs" : "text-sm"}`}
        >
          {round.target ? <MatchedHex value={round.target} target={guess} missClass="" /> : "…"}
        </div>
        <span className="text-dark-text-muted">current guess</span>
        <div
          className={`break-all rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 ${length === MAX_LENGTH ? "text-xs" : "text-sm"}`}
        >
          {guess ? <MatchedHex value={guess} target={round.target} /> : "—"}
        </div>
        {length === MAX_LENGTH && (
          <div className="flex flex-col gap-1.5">
            <span className="text-dark-text-muted">
              {matches} of {length} characters match
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-elevated">
              <div
                className="h-full rounded-full bg-mint-bright transition-all duration-300"
                style={{ width: `${(matches / length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2 text-sm leading-relaxed text-dark-text-muted empty:hidden">
        {round.phase === "idle" && length < MAX_LENGTH && !hasStarted && (
          <p className="m-0">
            This example will brute force crack a vastly oversimplified key that&apos;s only one hex character long by
            guessing a possible key value once per second. Press go to brute-force guess the key.
          </p>
        )}
        {showLengthHint && round.phase === "idle" && length < MAX_LENGTH && (
          <p className="m-0">Each extra character adds 16 times as many possibilities.</p>
        )}
        {running && <p className="m-0">Eight guesses per second.</p>}
        {running && length > 1 && multiCharacterRuns === 1 && (
          <p className="m-0">Each guess is tried only once. The entire key must match.</p>
        )}
        {round.phase === "cracked" && (
          <p className="m-0">
            Cracked in{" "}
            <strong className="font-semibold text-dark-text">
              {round.guesses} {round.guesses === 1 ? "guess" : "guesses"}!
            </strong>
            {length === 1 && " Add another character and run it again."}
          </p>
        )}
        {hasAttemptedTwoCharacters &&
          length < MAX_LENGTH &&
          (round.phase === "stopped" || (round.phase === "cracked" && length > 1)) && (
            <p className="m-0">
              {round.phase === "stopped" &&
                `You stopped after ${round.guesses.toLocaleString("en-US")} ${round.guesses === 1 ? "guess" : "guesses"}. `}
              {length === 2
                ? "Add another character or jump right to the full-length key to see how long that would take."
                : "Try the full-length key to see how long that would take."}
            </p>
          )}
      </div>
      {length < MAX_LENGTH && round.phase !== "idle" && (
        <p className="m-0 text-sm leading-relaxed text-dark-text-muted">
          Average time at 8 guesses/sec: <strong className="font-semibold text-dark-text">{averageTime(length)}</strong>
          .
        </p>
      )}
      {length === MAX_LENGTH && round.phase === "stopped" && (
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-dark-text-muted">
          <p className="m-0">
            <strong className="font-semibold text-dark-text">
              You gave up after {round.guesses.toLocaleString("en-US")} {round.guesses === 1 ? "guess" : "guesses"}.
              Good call.
            </strong>
          </p>
          <p className="m-0">
            A real key has 2²⁵⁶ possible values, about 1.16 × 10⁷⁷ different combinations. Cracking one takes around 5.8
            × 10⁷⁶ guesses on average. At eight guesses per second, that’s roughly 2.3 × 10⁶⁸ years. The universe is
            about 14 billion years old. It works out that you’d have to watch this example spin for around 1.6 × 10⁵⁸
            lifetimes of the universe to guess the correct key!
          </p>
          <p className="m-0">
            Compute speed wouldn’t help either. A supercomputer trying a quintillion (10¹⁸) keys every second still
            needs about 10⁵¹ years. Nobody guesses a private key. The only way to lose yours is to give it away.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        {running ? (
          <button
            type="button"
            className="btn btn-primary h-auto px-4 py-2.5 text-sm font-semibold!"
            disabled={length === 1 || (length === MAX_LENGTH && giveUpSecondsLeft > 0)}
            onClick={() => {
              if (length === 1 || (length === MAX_LENGTH && giveUpSecondsLeft > 0)) return;
              setRound(current => ({ ...current, phase: "stopped" }));
            }}
          >
            <span className="text-sm font-semibold normal-case">
              {length === 1
                ? "Guessing..."
                : length === MAX_LENGTH
                  ? giveUpSecondsLeft > 0
                    ? `Give Up (${giveUpSecondsLeft}s)`
                    : "Give Up"
                  : "Give Up"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary h-auto px-4 py-2.5 text-sm font-semibold!"
            disabled={!round.target}
            onClick={() => {
              setHasStarted(true);
              setGiveUpSecondsLeft(length === MAX_LENGTH ? GIVE_UP_DELAY_SECONDS : 0);
              setShowLengthHint(false);
              if (length > 1) setMultiCharacterRuns(count => count + 1);
              setRound({ ...(round.phase === "idle" ? round : newRound(length)), phase: "running" });
            }}
          >
            <span className="text-sm font-semibold normal-case">{round.phase === "idle" ? "Go" : "Try again"}</span>
          </button>
        )}
        {length === MAX_LENGTH && round.phase === "stopped" && (
          <button
            type="button"
            className="btn btn-outline h-auto px-4 py-2.5 text-sm font-semibold!"
            onClick={() => setInteractiveOpen(false)}
          >
            <span className="text-sm font-semibold normal-case">Done</span>
          </button>
        )}
        {hasCrackedSingleCharacter && length < MAX_LENGTH && (length === 1 || hasAttemptedTwoCharacters) && (
          <button
            type="button"
            className="btn btn-outline h-auto px-4 py-2.5 text-sm font-semibold!"
            onClick={() => changeLength(length + 1)}
          >
            <span className="text-sm font-semibold normal-case">Add a character</span>
          </button>
        )}
        {hasAttemptedTwoCharacters && length < MAX_LENGTH && (
          <button
            type="button"
            className="btn btn-outline h-auto px-4 py-2.5 text-sm font-semibold!"
            onClick={() => changeLength(MAX_LENGTH)}
          >
            <span className="text-sm font-semibold normal-case">Try a full-length key</span>
          </button>
        )}
      </div>
    </div>
  );
};
