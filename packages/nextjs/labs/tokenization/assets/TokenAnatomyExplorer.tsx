"use client";

// What's actually on-chain, made poke-able. The on-chain record is three
// fields; everything visual hangs off the tokenURI pointer into IPFS. Two
// experiments, one per claim:
//   • Transfer the token → only the owner field changes. The metadata and the
//     art don't move, because they were never on the chain to begin with.
//   • Tamper with the image → IPFS addresses are content hashes, so the
//     "changed" image is a NEW file at a NEW address. The on-chain pointer
//     still names the original: a mismatch, not a swap.
import { useState } from "react";

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

const OWNERS = { alice: "0x3f8a...c21b", bob: "0x91d4...77e0" } as const;
const REAL_CID = "QmfVM...R5Xr";
const FAKE_CID = "QmT9p...a03c";

export const TokenAnatomyExplorer = () => {
  const [owner, setOwner] = useState<keyof typeof OWNERS>("alice");
  const [tampered, setTampered] = useState(false);
  const [flash, setFlash] = useState<"owner" | "image" | null>(null);

  const transfer = () => {
    setOwner(o => (o === "alice" ? "bob" : "alice"));
    setFlash("owner");
  };
  const tamper = () => {
    setTampered(true);
    setFlash("image");
  };
  const reset = () => {
    setOwner("alice");
    setTampered(false);
    setFlash(null);
  };

  const mismatch = tampered;

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm" style={{ color: COLOR.text }}>
        The NFT on the chain is <em>three fields</em>. Everything you can see hangs off the last one, a pointer into
        IPFS, where addresses are content hashes.
      </p>

      <div className="flex flex-wrap gap-1.5">
        <button className="btn btn-xs btn-primary font-mono" onClick={transfer}>
          transfer to {owner === "alice" ? "bob" : "alice"}
        </button>
        <button className="btn btn-xs btn-error font-mono" onClick={tamper} disabled={tampered}>
          tamper with the image
        </button>
        <button className="btn btn-xs btn-ghost ml-auto border border-white/10 font-mono text-white/70" onClick={reset}>
          reset
        </button>
      </div>

      <svg viewBox="0 0 420 330" className="w-full rounded-xl" style={{ background: "rgb(0 0 0 / 0.25)" }}>
        {/* on-chain record */}
        <text x={20} y={28} fontSize={9.5} fill={COLOR.faint} className="font-mono">
          ON-CHAIN · the whole NFT
        </text>
        <rect
          x={16}
          y={38}
          width={180}
          height={130}
          rx={12}
          fill={COLOR.panel}
          stroke={COLOR.violet}
          strokeWidth={1.5}
        />
        <text x={32} y={66} fontSize={10.5} fill={COLOR.text} className="font-mono">
          tokenId
        </text>
        <text x={180} y={66} fontSize={10.5} fill={COLOR.mint} textAnchor="end" className="font-mono">
          1
        </text>
        <line x1={32} y1={78} x2={180} y2={78} stroke="rgb(255 255 255 / 0.08)" />
        <text x={32} y={100} fontSize={10.5} fill={COLOR.text} className="font-mono">
          owner
        </text>
        <text
          x={180}
          y={100}
          fontSize={10.5}
          textAnchor="end"
          className="font-mono"
          fill={flash === "owner" ? COLOR.mint : COLOR.violet}
          style={{ transition: "fill 600ms" }}
        >
          {OWNERS[owner]}
        </text>
        <line x1={32} y1={112} x2={180} y2={112} stroke="rgb(255 255 255 / 0.08)" />
        <text x={32} y={134} fontSize={10.5} fill={COLOR.text} className="font-mono">
          tokenURI
        </text>
        <text
          x={180}
          y={152}
          fontSize={9.5}
          fill={mismatch ? COLOR.rogue : COLOR.violet}
          textAnchor="end"
          className="font-mono"
          style={{ transition: "fill 600ms" }}
        >
          ipfs://{REAL_CID}
        </text>

        {/* pointer arrow to IPFS */}
        <path
          d="M 196 150 C 240 150, 240 210, 270 226"
          fill="none"
          stroke={mismatch ? COLOR.rogue : COLOR.mint}
          strokeWidth={2}
          strokeDasharray={mismatch ? "4 5" : "none"}
          style={{ transition: "stroke 600ms" }}
        />
        {mismatch && (
          <text x={214} y={196} fontSize={16} fill={COLOR.rogue} className="font-mono">
            ✗
          </text>
        )}

        {/* IPFS side */}
        <text x={250} y={28} fontSize={9.5} fill={COLOR.faint} className="font-mono">
          OFF-CHAIN · IPFS
        </text>
        {/* metadata json */}
        <rect x={236} y={38} width={168} height={104} rx={12} fill={COLOR.panel} stroke={COLOR.faint} strokeWidth={1} />
        <text x={250} y={60} fontSize={9} fill={COLOR.faint} className="font-mono">
          {REAL_CID}
        </text>
        <text x={250} y={82} fontSize={9.5} fill={COLOR.text} className="font-mono">
          {'{ "name": "Buffalo",'}
        </text>
        <text x={260} y={98} fontSize={9.5} fill={COLOR.text} className="font-mono">
          {'"image":'}
        </text>
        <text x={260} y={114} fontSize={9} fill={COLOR.violet} className="font-mono">
          {'"ipfs://QmYd..." }'}
        </text>

        {/* the image file */}
        <rect
          x={252}
          y={172}
          width={136}
          height={118}
          rx={12}
          fill={COLOR.panel}
          stroke={mismatch ? COLOR.rogue : COLOR.faint}
          strokeWidth={mismatch ? 1.5 : 1}
          style={{ transition: "stroke 600ms" }}
        />
        {/* the art itself: circle originally; tampering swaps it for a jagged imposter */}
        {tampered ? (
          <path
            d="M 320 196 L 336 226 L 368 230 L 344 250 L 352 280 L 320 264 L 288 280 L 296 250 L 272 230 L 304 226 Z"
            fill={COLOR.rogueFill}
            stroke={COLOR.rogue}
            strokeWidth={1.5}
          />
        ) : (
          <>
            <circle cx={320} cy={228} r={28} fill={COLOR.mintFill} stroke={COLOR.mint} strokeWidth={1.5} />
            <path d="M 268 282 Q 320 244 372 282" fill="none" stroke={COLOR.violet} strokeWidth={1.5} />
          </>
        )}
        <text
          x={320}
          y={308}
          fontSize={8.5}
          fill={mismatch ? COLOR.rogue : COLOR.faint}
          textAnchor="middle"
          className="font-mono"
          style={{ transition: "fill 600ms" }}
        >
          {tampered ? `new file → new hash: ${FAKE_CID}` : `content hash: ${REAL_CID}`}
        </text>
      </svg>

      <div
        className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
        style={{
          border: `1px solid ${flash ? (flash === "image" ? COLOR.rogue : COLOR.mint) : "rgb(255 255 255 / 0.1)"}`,
          color: COLOR.text,
          minHeight: "3.5rem",
        }}
      >
        {flash === "owner" && (
          <>
            <span className="font-mono font-semibold" style={{ color: COLOR.mint }}>
              only the owner field changed.
            </span>{" "}
            The metadata and the art didn&apos;t move. They were never on the chain. Trading an NFT is rewriting one
            ledger row, which is why it costs the same gas whether the art is a doodle or a masterpiece.
          </>
        )}
        {flash === "image" && (
          <>
            <span className="font-mono font-semibold" style={{ color: COLOR.rogue }}>
              you made a different file.
            </span>{" "}
            An IPFS address <em>is</em> the hash of the content, so the &quot;swapped&quot; image lives at a new
            address. The token still points at the original: what you minted is what stays.
          </>
        )}
        {!flash && (
          <span style={{ color: COLOR.faint }}>
            Try both buttons. One changes the chain, the other only proves it can&apos;t be silently changed.
          </span>
        )}
      </div>
    </div>
  );
};
