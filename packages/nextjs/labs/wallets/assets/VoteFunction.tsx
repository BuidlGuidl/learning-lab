"use client";

// The vote() function the learner is about to call, annotated line by line.
//
// CodeBlock can't back this: it hands shiki's HTML to dangerouslySetInnerHTML,
// which leaves no React node per line to hang a hover on. So this renders the
// tokens itself — the same codeToTokensBase + decodeFontStyle path CodeInput
// uses. It opens in the side rail (the card's `interactive` slot), and that rail
// is dark in both themes, so this uses the fixed dark-* palette and pins shiki
// to the dark theme rather than following resolvedTheme.
//
// Explanations use 1-based line numbers in SOURCE below.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { decodeFontStyle, getHighlighter } from "~~/components/code/highlighter";

const SOURCE = `function vote(Season season) external {
    require(!hasVoted[msg.sender], "SeasonPoll: address has already voted");

    hasVoted[msg.sender] = true;
    ballot[msg.sender] = season;
    tally[uint256(season)] += 1;

    emit Voted(msg.sender, season);
}`;

const C = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-dark-elevated px-1 py-0.5 font-mono text-[0.9em] text-dark-text">{children}</code>
);

// from/to are 1-based and inclusive. Lines covered by no note (the blank ones)
// stay inert — there is nothing honest to say about them.
type Note = { from: number; to: number; text: ReactNode };

const NOTES: Note[] = [
  {
    from: 1,
    to: 1,
    text: (
      <>
        The signature. <C>external</C> means anyone outside the contract can call it — your wallet is about to. Its one
        input is the <C>Season</C> you will cast in your vote.
      </>
    ),
  },
  {
    from: 2,
    to: 2,
    text: (
      <>
        The contract&apos;s one rule: each address only gets one vote. <C>require</C> tests that the address voting (
        <C>msg.sender</C>) does not appear in the <C>hasVoted</C> mapping. If the <C>msg.sender</C> has already voted,
        the user is shown the <C>SeasonPoll: address has already voted</C> error message and none of the code runs
        below.
      </>
    ),
  },
  {
    from: 4,
    to: 4,
    text: (
      <>
        Records that your address has cast a vote in the <C>hasVoted</C> mapping.
      </>
    ),
  },
  {
    from: 5,
    to: 5,
    text: (
      <>
        Stores which season you chose, filed under your address. This is what makes the poll public: anyone can look up
        any address and see its vote.
      </>
    ),
  },
  {
    from: 6,
    to: 6,
    text: <>Adds one to that season&apos;s running total.</>,
  },
  {
    from: 8,
    to: 8,
    text: (
      <>
        This <C>emit</C> statement is used to pass information along to UIs. This one announces that someone has cast a
        vote, along with the address that cast the vote and which season they voted for.
      </>
    ),
  },
  {
    from: 9,
    to: 9,
    text: <>The end. Reaching here without reverting means every change above is now a permanent part of Sepolia.</>,
  },
];

const noteIndexForLine = (line: number) => NOTES.findIndex(note => line >= note.from && line <= note.to);

// Structural subset of shiki's ThemedToken — all this renderer reads.
type Token = { content: string; color?: string; fontStyle?: number };

const RAW_LINES: Token[][] = SOURCE.split("\n").map(line => [{ content: line }]);

export const VoteFunction = () => {
  // Until the highlighter loads, the same lines render uncolored — identical
  // structure, so nothing shifts when the colors arrive.
  const [lines, setLines] = useState<Token[][] | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then(h => {
      if (!cancelled) setLines(h.codeToTokensBase(SOURCE, { lang: "solidity", theme: "github-dark-dimmed" }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 text-dark-text">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs text-dark-text-faint">SeasonPoll.sol</span>
        <span className="text-xs text-dark-text-faint">hover a line for a plain-English translation</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-dark-border bg-dark-surface">
        <div className="w-max min-w-full py-2" onMouseLeave={() => setActive(null)}>
          {(lines ?? RAW_LINES).map((tokens, index) => {
            const lineNumber = index + 1;
            const noteIndex = noteIndexForLine(lineNumber);
            const content = tokens.length ? (
              tokens.map((token, tokenIndex) => {
                const { italic, bold, underline } = decodeFontStyle(token.fontStyle);
                return (
                  <span
                    key={tokenIndex}
                    style={{
                      color: token.color,
                      fontStyle: italic ? "italic" : undefined,
                      fontWeight: bold ? "bold" : undefined,
                      textDecoration: underline ? "underline" : undefined,
                    }}
                  >
                    {token.content}
                  </span>
                );
              })
            ) : (
              <>&nbsp;</>
            );
            const rowClass = "block w-full whitespace-pre px-4 py-0.5 text-left font-mono text-xs leading-relaxed";

            if (noteIndex === -1) {
              return (
                <div key={lineNumber} className={rowClass}>
                  {content}
                </div>
              );
            }
            // Hovering already sets the active note, so the active background is
            // also the hover state — no separate hover class to keep in sync.
            return (
              <button
                key={lineNumber}
                type="button"
                onMouseEnter={() => setActive(noteIndex)}
                onFocus={() => setActive(noteIndex)}
                onClick={() => setActive(noteIndex)}
                className={`${rowClass} cursor-pointer ${active === noteIndex ? "bg-dark-elevated" : ""}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-live="polite"
        className="min-h-[4.5rem] rounded-lg border border-dark-border bg-dark-surface px-4 py-3 text-sm leading-relaxed text-dark-text-muted"
      >
        {active === null ? (
          <span className="text-dark-text-faint">Hover any line of the function to see what it does.</span>
        ) : (
          NOTES[active].text
        )}
      </div>
    </div>
  );
};
