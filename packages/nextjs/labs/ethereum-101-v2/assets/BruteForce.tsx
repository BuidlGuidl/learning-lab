"use client";

// Brute-forcing a private key, made playable — the concept card's "could
// someone just guess your key?" question, answered in two rounds:
//   • Toy key  → one hex character, 16 possibilities. A pre-shuffled deck of
//                every value, one guess per second, never repeating — the
//                mechanism visibly works, and cracks inside 16 seconds.
//   • Real key → 64 hex characters, 2^256 possibilities. The same loop at the
//                same pace. A "give up" button unlocks after 10 guesses, and
//                the payoff is the math: ~1.16 × 10^77 keys, ~1.8 × 10^69
//                years at this pace. Guessing isn't hard — it's hopeless.
import { useEffect, useState } from "react";

type Phase = "idle" | "toy" | "toyCracked" | "real" | "gaveUp";

const ROLL_MS = 1000; // one guess per second, both rounds
const GIVE_UP_AFTER = 10; // real-key guesses before "give up" unlocks

const HEX = "0123456789abcdef".split("");
const randomHex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join("");

const shuffled = <T,>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// A guess rendered char-by-char against the target: matches light up mint,
// misses go orange, and the 0x prefix stays grey — so "close" guesses show
// how far they really are.
const MatchedHex = ({ value, target }: { value: string; target: string }) => (
  <span className="break-all">
    <span className="text-dark-text-muted">0x</span>
    {value.split("").map((ch, i) => (
      <span key={i} className={ch === target[i] ? "text-mint-bright" : "text-peach-bright"}>
        {ch}
      </span>
    ))}
  </span>
);

const captionFor = (phase: Phase, toyGuesses: number) => {
  switch (phase) {
    case "idle":
      return "This example will brute force crack a vastly oversimplified key that's only one hex character long by guessing a possible key value once per second. Press go to brute-force guess the key.";
    case "toy":
      return "Guessing one value per second.";
    case "toyCracked":
      return `Cracked in ${toyGuesses} ${toyGuesses === 1 ? "guess" : "guesses"}. With only 16 possibilities, brute force works great! Now run the exact same attack on a real 256-bit key.`;
    case "real":
      return "Now the key is 64 hex characters. Watch how few of them ever line up.";
    case "gaveUp":
      return "";
  }
};

export const BruteForce = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [toyTarget, setToyTarget] = useState("");
  const [toyDeck, setToyDeck] = useState<string[]>([]);
  const [toyTried, setToyTried] = useState(0); // guesses made = toyDeck.slice(0, toyTried)
  const [realTarget, setRealTarget] = useState("");
  const [realGuess, setRealGuess] = useState("");
  const [realCount, setRealCount] = useState(0);

  // targets are random, so they're picked after mount (not during render) to
  // keep server and client markup identical
  const deal = () => {
    setToyTarget(HEX[Math.floor(Math.random() * 16)]);
    setToyDeck(shuffled(HEX));
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    setRealTarget(
      Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join(""),
    );
  };
  useEffect(deal, []);

  useEffect(() => {
    if (phase !== "toy") return;
    const id = setInterval(() => {
      // toyTried is the single source of progress, so a re-run of this effect
      // can never replay the round
      setToyTried(t => {
        const tried = t + 1;
        if (toyDeck[tried - 1] === toyTarget) {
          clearInterval(id);
          setPhase("toyCracked");
        }
        return tried;
      });
    }, ROLL_MS);
    return () => clearInterval(id);
  }, [phase, toyDeck, toyTarget]);

  useEffect(() => {
    if (phase !== "real") return;
    const id = setInterval(() => {
      setRealGuess(randomHex(64));
      setRealCount(c => c + 1);
    }, ROLL_MS);
    return () => clearInterval(id);
  }, [phase]);

  const reset = () => {
    setPhase("idle");
    setToyTried(0);
    setRealGuess("");
    setRealCount(0);
    deal();
  };

  // the first guess of each round lands on the click itself; the intervals
  // above only carry on from there
  const startToy = () => {
    setToyTried(1);
    setPhase(toyDeck[0] === toyTarget ? "toyCracked" : "toy");
  };

  const startReal = () => {
    setRealGuess(randomHex(64));
    setRealCount(1);
    setPhase("real");
  };

  const toyGuess = toyTried > 0 ? toyDeck[toyTried - 1] : "";
  const onRealKey = phase === "real" || phase === "gaveUp";
  const guesses = onRealKey ? realCount : toyTried;
  const canGiveUp = realCount >= GIVE_UP_AFTER;
  const matches = realGuess ? realGuess.split("").filter((ch, i) => ch === realTarget[i]).length : 0;

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">guesses</span>
          <strong className="font-semibold text-dark-text">{guesses}</strong>
        </span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      {!onRealKey ? (
        <div className="flex flex-col gap-3 rounded-lg border border-dark-border bg-lab-code-panel-tint p-3 font-mono text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-dark-text-muted">target key · 16 possibilities</span>
            <span className="rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 text-sm">
              0x{toyTarget || "…"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2 text-sm">
              {toyGuess ? (
                <MatchedHex value={toyGuess} target={toyTarget} />
              ) : (
                <>
                  <span className="text-dark-text-muted">0x</span>—
                </>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-dark-border bg-lab-code-panel-tint p-3 font-mono text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-dark-text-muted">target key · 2²⁵⁶ possibilities</span>
            <span className="break-all rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2">
              0x{realTarget}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="rounded-md border border-dark-border bg-dark-subtle px-2.5 py-2">
              {realGuess ? (
                <MatchedHex value={realGuess} target={realTarget} />
              ) : (
                <>
                  <span className="text-dark-text-muted">0x</span>—
                </>
              )}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-dark-text-muted">{matches} of 64 characters match</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-elevated">
              <div
                className="h-full rounded-full bg-mint-bright transition-all duration-300"
                style={{ width: `${(matches / 64) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "gaveUp" ? (
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-dark-text-muted">
          <p className="m-0">
            <strong className="font-semibold text-dark-text">
              You gave up after {realCount} {realCount === 1 ? "guess" : "guesses"}. Good call.
            </strong>
          </p>
          <p className="m-0">
            A real key has 2²⁵⁶ possible values, about 1.16 × 10⁷⁷ different combinations. Cracking one takes around 5.8
            × 10⁷⁶ guesses on average. At one guess per second, that’s roughly 1.8 × 10⁶⁹ years. The universe is about
            14 billion years old. It works out that you’d have to watch this example spin for around 10⁵⁹ lifetimes of
            the universe to guess the correct key!
          </p>
          <p className="m-0">
            Compute speed wouldn’t help either. A supercomputer trying a quintillion (10¹⁸) keys every second still
            needs about 10⁵¹ years. Nobody guesses a private key. The only way to lose yours is to give it away.
          </p>
        </div>
      ) : (
        <p className="m-0 min-h-[2.5rem] text-sm leading-relaxed text-dark-text-muted">{captionFor(phase, toyTried)}</p>
      )}

      <div className="flex flex-wrap gap-2.5">
        {phase === "idle" && (
          <button
            type="button"
            onClick={startToy}
            disabled={!toyTarget}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go
          </button>
        )}
        {phase === "toy" && (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] opacity-50"
          >
            guessing…
          </button>
        )}
        {phase === "toyCracked" && (
          <button
            type="button"
            onClick={startReal}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90"
          >
            Crack a real key
          </button>
        )}
        {phase === "real" && (
          <button
            type="button"
            onClick={() => setPhase("gaveUp")}
            disabled={!canGiveUp}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canGiveUp ? "Give up" : `Give up (${Math.ceil(((GIVE_UP_AFTER - realCount) * ROLL_MS) / 1000)}s)`}
          </button>
        )}
      </div>
    </div>
  );
};
