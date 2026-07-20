"use client";

// The _safeMint delivery check, made visible. Pick a receiver and a mint
// method, press mint, and watch the beats:
//   • _safeMint to a contract → the "onERC721Received?" handshake. The
//     FriendlyGallery answers with the magic value and the token moves in;
//     the NaiveVault stays silent and the whole transaction reverts; the
//     token bounces back, never stranded.
//   • _mint skips the handshake entirely. Same vault, no check: the token
//     drops in and a padlock closes over it. Nothing can ever move it again.
//   • A wallet (EOA) has no code to ask, so both methods deliver.
// The scene is SVG with CSS-transition travel; the beats are a small
// setTimeout chain, restartable at any point.
import { useEffect, useRef, useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";

type Receiver = "wallet" | "vault" | "gallery";
type Method = "_safeMint" | "_mint";
type Beat = "idle" | "travel" | "ask" | "answer" | "accepted" | "reverting" | "reverted" | "stranded";

// dark-panel palette (the rail is dark in both themes), aligned to the lab tokens
const COLOR = {
  text: "#eee8ff",
  faint: "#766892",
  violet: "#a87dff",
  violetFill: "rgb(168 125 255 / 0.16)",
  mint: "#54d6a8",
  mintFill: "rgb(84 214 168 / 0.18)",
  rogue: "#ff7ccb",
  rogueFill: "rgb(255 124 203 / 0.16)",
  panel: "rgb(238 232 255 / 0.06)",
};

const RECEIVERS: Record<Receiver, { name: string; sub: string; hasCode: boolean; answers: boolean }> = {
  wallet: { name: "a wallet", sub: "EOA, no code", hasCode: false, answers: false },
  vault: { name: "NaiveVault", sub: "contract, no onERC721Received", hasCode: true, answers: false },
  gallery: { name: "FriendlyGallery", sub: "contract, implements the hook", hasCode: true, answers: true },
};

// where the token sits per beat (scene coordinates)
const TOKEN_HOME = { x: 78, y: 150 };
const TOKEN_DOOR = { x: 268, y: 150 };
const TOKEN_IN = { x: 322, y: 150 };

const OUTCOME: Record<string, { tone: "good" | "bad" | "warn"; title: string; note: string }> = {
  "wallet:_safeMint:accepted": {
    tone: "good",
    title: "delivered",
    note: "A wallet has no code, so there is nothing to ask. _safeMint only runs the handshake when the receiver is a contract.",
  },
  "wallet:_mint:accepted": {
    tone: "good",
    title: "delivered",
    note: "Fine here, but only because a wallet's keys can always move the token later. The risk is contracts, not wallets.",
  },
  "gallery:_safeMint:accepted": {
    tone: "good",
    title: "delivered, handshake passed",
    note: "The gallery answered onERC721Received with the magic value, proving it knows how to hold (and later move) NFTs.",
  },
  "gallery:_mint:accepted": {
    tone: "warn",
    title: "delivered, but nobody checked",
    note: "It worked because this receiver happens to handle NFTs. _mint didn't verify that. Against the vault, this same call is a disaster.",
  },
  "vault:_safeMint:reverted": {
    tone: "good",
    title: "reverted, token saved",
    note: "The vault never answered the handshake, so the whole transaction rolled back. The token was never created. That revert is _safeMint doing its job.",
  },
  "vault:_mint:stranded": {
    tone: "bad",
    title: "minted and stranded forever",
    note: "_mint skipped the check. The vault now owns token #1, has no idea it does, and contains no function that could ever transfer it out. No one can fix this after deployment.",
  },
};

export const SafeMintHandshake = () => {
  const [receiver, setReceiver] = useState<Receiver>("vault");
  const [method, setMethod] = useState<Method>("_safeMint");
  const [beat, setBeat] = useState<Beat>("idle");
  const [run, setRun] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const mint = () => {
    clearTimers();
    setRun(r => r + 1);
    setBeat("travel");
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    const target = RECEIVERS[receiver];
    const checks = method === "_safeMint" && target.hasCode;

    if (!checks) {
      // no handshake: straight in (wallet either way, or _mint to any contract)
      at(900, () => setBeat(receiver === "vault" ? "stranded" : "accepted"));
      return;
    }
    // _safeMint to a contract: travel → ask → answer (or silence) → outcome
    at(900, () => setBeat("ask"));
    at(2100, () => setBeat("answer"));
    if (target.answers) {
      at(3300, () => setBeat("accepted"));
    } else {
      at(3300, () => setBeat("reverting"));
      at(4200, () => setBeat("reverted"));
    }
  };

  const pick = (r: Receiver) => {
    clearTimers();
    setReceiver(r);
    setBeat("idle");
  };
  const flip = (m: Method) => {
    clearTimers();
    setMethod(m);
    setBeat("idle");
  };

  const target = RECEIVERS[receiver];
  const running = beat === "travel" || beat === "ask" || beat === "answer" || beat === "reverting";
  const settled = beat === "accepted" || beat === "reverted" || beat === "stranded";
  const outcome = settled ? OUTCOME[`${receiver}:${method}:${beat}`] : null;

  // token position + look per beat
  const tokenAt =
    beat === "idle" || beat === "reverted"
      ? TOKEN_HOME
      : beat === "accepted" || beat === "stranded"
        ? TOKEN_IN
        : beat === "reverting"
          ? TOKEN_HOME
          : TOKEN_DOOR;
  const tokenGone = beat === "reverted"; // rolled back: it never existed
  const toneColor = outcome?.tone === "bad" ? COLOR.rogue : outcome?.tone === "warn" ? COLOR.violet : COLOR.mint;

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm" style={{ color: COLOR.text }}>
        One mint, two methods. <code className="font-mono">_safeMint</code> asks a contract receiver whether it can
        handle the token; <code className="font-mono">_mint</code> just delivers, no questions asked.
      </p>

      {/* receiver picker */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(RECEIVERS) as Receiver[]).map(r => (
          <button
            key={r}
            className={`btn btn-xs font-mono ${receiver === r ? "btn-primary" : "btn-ghost border border-white/10 text-white/70"}`}
            onClick={() => pick(r)}
          >
            {RECEIVERS[r].name}
          </button>
        ))}
      </div>

      {/* method toggle + go */}
      <div className="flex items-center gap-1.5">
        {(["_safeMint", "_mint"] as Method[]).map(m => (
          <button
            key={m}
            className={`btn btn-xs font-mono ${method === m ? (m === "_mint" ? "btn-error" : "btn-success") : "btn-ghost border border-white/10 text-white/70"}`}
            onClick={() => flip(m)}
          >
            {m}
          </button>
        ))}
        <button className="btn btn-xs btn-outline ml-auto font-mono text-white/90" onClick={mint} disabled={running}>
          {running ? "minting..." : "mint #1"}
        </button>
      </div>

      <svg viewBox="0 0 420 300" className="w-full rounded-xl" style={{ background: "rgb(0 0 0 / 0.25)" }}>
        {/* minter */}
        <circle cx={78} cy={150} r={40} fill={COLOR.violetFill} stroke={COLOR.violet} strokeWidth={1.5} />
        <text x={78} y={144} textAnchor="middle" fontSize={11} fill={COLOR.text} className="font-mono">
          mintItem
        </text>
        <text x={78} y={162} textAnchor="middle" fontSize={10} fill={COLOR.violet} className="font-mono">
          {method}
        </text>

        {/* receiver box */}
        <rect
          x={272}
          y={86}
          width={128}
          height={128}
          rx={14}
          fill={COLOR.panel}
          stroke={
            beat === "stranded"
              ? COLOR.rogue
              : settled && outcome?.tone === "good" && tokenAt === TOKEN_IN
                ? COLOR.mint
                : COLOR.faint
          }
          strokeWidth={1.5}
        />
        <text x={336} y={110} textAnchor="middle" fontSize={11.5} fill={COLOR.text} className="font-mono">
          {target.name}
        </text>
        <text x={336} y={126} textAnchor="middle" fontSize={8.5} fill={COLOR.faint} className="font-mono">
          {target.sub}
        </text>

        {/* travel path */}
        <line x1={122} y1={150} x2={268} y2={150} stroke={COLOR.faint} strokeWidth={1} strokeDasharray="3 5" />

        {/* the handshake bubble */}
        {(beat === "ask" || beat === "answer") && (
          <g>
            <rect
              x={148}
              y={52}
              width={190}
              height={30}
              rx={8}
              fill={COLOR.panel}
              stroke={COLOR.violet}
              strokeWidth={1}
            />
            <text x={243} y={71} textAnchor="middle" fontSize={10.5} fill={COLOR.text} className="font-mono">
              onERC721Received?
            </text>
            <line x1={310} y1={84} x2={330} y2={92} stroke={COLOR.violet} strokeWidth={1} />
          </g>
        )}
        {beat === "answer" &&
          (target.answers ? (
            <g>
              <rect
                x={172}
                y={228}
                width={166}
                height={28}
                rx={8}
                fill={COLOR.mintFill}
                stroke={COLOR.mint}
                strokeWidth={1}
              />
              <text x={255} y={246} textAnchor="middle" fontSize={10} fill={COLOR.mint} className="font-mono">
                ✓ magic value returned
              </text>
            </g>
          ) : (
            <g>
              <rect
                x={224}
                y={228}
                width={114}
                height={28}
                rx={8}
                fill={COLOR.panel}
                stroke={COLOR.faint}
                strokeWidth={1}
              />
              <text x={281} y={246} textAnchor="middle" fontSize={10.5} fill={COLOR.faint} className="font-mono">
                silence
              </text>
            </g>
          ))}

        {/* the token */}
        {!tokenGone && (
          <g
            key={run}
            style={{
              transform: `translate(${tokenAt.x}px, ${tokenAt.y}px)`,
              transition: beat === "idle" ? "none" : "transform 800ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <circle
              r={17}
              fill={beat === "stranded" ? COLOR.rogueFill : COLOR.mintFill}
              stroke={beat === "stranded" ? COLOR.rogue : COLOR.mint}
              strokeWidth={1.5}
            />
            <text
              y={4.5}
              textAnchor="middle"
              fontSize={11}
              fill={beat === "stranded" ? COLOR.rogue : COLOR.mint}
              className="font-mono"
            >
              #1
            </text>
          </g>
        )}
        {/* padlock over a stranded token */}
        {beat === "stranded" && (
          <g transform={`translate(${TOKEN_IN.x + 14}, ${TOKEN_IN.y - 30})`}>
            <rect x={-7} y={0} width={14} height={11} rx={2.5} fill={COLOR.rogue} />
            <path d="M -4 0 v -4 a 4 4 0 0 1 8 0 v 4" fill="none" stroke={COLOR.rogue} strokeWidth={2} />
          </g>
        )}
        {/* revert flash */}
        {beat === "reverting" && (
          <text x={195} y={140} textAnchor="middle" fontSize={11} fill={COLOR.rogue} className="font-mono">
            revert: rolling everything back
          </text>
        )}
      </svg>

      {/* outcome banner */}
      <div
        className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
        style={{
          border: `1px solid ${settled ? toneColor : "rgb(255 255 255 / 0.1)"}`,
          color: COLOR.text,
          minHeight: "3.5rem",
        }}
      >
        {outcome ? (
          <>
            <span className="mr-1 inline-flex items-center gap-1 font-mono font-semibold" style={{ color: toneColor }}>
              {beat === "stranded" && <LockClosedIcon className="inline h-3.5 w-3.5" />}
              {outcome.title}.
            </span>
            {outcome.note}
          </>
        ) : running ? (
          <span style={{ color: COLOR.faint }}>
            {beat === "travel" && "the token heads for its new owner..."}
            {beat === "ask" && `${method} sees code at the receiving address and asks the question...`}
            {beat === "answer" &&
              (target.answers ? "the gallery knows the answer..." : "the vault has no idea what it's being asked...")}
            {beat === "reverting" && "no valid answer, so the EVM reverts the whole transaction..."}
          </span>
        ) : (
          <span style={{ color: COLOR.faint }}>
            Try <span className="font-mono">_safeMint</span> into the NaiveVault first, then do the same with{" "}
            <span className="font-mono">_mint</span> and compare what survives.
          </span>
        )}
      </div>
    </div>
  );
};
