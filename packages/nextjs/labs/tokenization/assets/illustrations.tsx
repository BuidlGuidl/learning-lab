"use client";

// The tokenization static illustrations. Unlike ethereum-101's PNG-based set,
// these are inline SVG components: theme-aware via the lab-* tokens, crisp at
// any width, and they keep the same contract as makeIllustration — a <figure>
// that renders inline under the card prose and hosts children as an overlay
// (where ConceptCard parks the "open interactive" button).
import type { ReactNode } from "react";

type Props = { children?: ReactNode };

const Frame = ({
  label,
  viewBox,
  children,
  overlay,
}: {
  label: string;
  viewBox: string;
  children: ReactNode;
  overlay?: ReactNode;
}) => (
  <figure className="relative m-0 w-full">
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="h-auto w-full rounded-xl border border-lab-border bg-lab-inset"
    >
      {children}
    </svg>
    {overlay}
  </figure>
);

// shared bits: a small monospace label
const Mono = ({
  x,
  y,
  size = 15,
  className = "fill-lab-muted",
  anchor = "start",
  children,
}: {
  x: number;
  y: number;
  size?: number;
  className?: string;
  anchor?: "start" | "middle" | "end";
  children: ReactNode;
}) => (
  <text x={x} y={y} fontSize={size} textAnchor={anchor} className={`font-mono ${className}`}>
    {children}
  </text>
);

// Ch1 · Fungible vs non-fungible — identical coins you can swap freely, next to
// numbered passports where the identity is the point.
export const UniqueVsFungible = ({ children }: Props) => (
  <Frame
    label="Left: a pile of identical ETH coins, any one exchangeable for any other. Right: three numbered token passports, each with its own id and art — none of them interchangeable."
    viewBox="0 0 1200 560"
    overlay={children}
  >
    {/* left panel — fungible */}
    <rect x={40} y={40} width={530} height={480} rx={18} className="fill-lab-surface stroke-lab-border" />
    <Mono x={70} y={88} size={20} className="fill-lab-text font-semibold">
      fungible
    </Mono>
    <Mono x={70} y={116} size={15}>
      any coin trades for any other
    </Mono>
    {[
      { cx: 180, cy: 260 },
      { cx: 305, cy: 220 },
      { cx: 430, cy: 260 },
      { cx: 240, cy: 380 },
      { cx: 370, cy: 380 },
    ].map((c, i) => (
      <g key={i}>
        <circle cx={c.cx} cy={c.cy} r={58} className="fill-lab-violet/15 stroke-lab-violet" strokeWidth={2} />
        <Mono x={c.cx} y={c.cy + 7} size={20} anchor="middle" className="fill-lab-violet">
          1 ETH
        </Mono>
      </g>
    ))}
    {/* swap arrows between two coins */}
    <path
      d="M 250 300 C 280 330, 330 330, 360 350"
      fill="none"
      className="stroke-lab-muted"
      strokeWidth={2.5}
      strokeDasharray="6 6"
      markerEnd="url(#arrow-muted)"
    />
    <path
      d="M 350 330 C 320 300, 280 300, 258 318"
      fill="none"
      className="stroke-lab-muted"
      strokeWidth={2.5}
      strokeDasharray="6 6"
      markerEnd="url(#arrow-muted)"
    />

    {/* right panel — non-fungible */}
    <rect x={630} y={40} width={530} height={480} rx={18} className="fill-lab-surface stroke-lab-border" />
    <Mono x={660} y={88} size={20} className="fill-lab-text font-semibold">
      non-fungible
    </Mono>
    <Mono x={660} y={116} size={15}>
      each token is one specific thing
    </Mono>
    {[
      {
        x: 665,
        id: 1,
        art: <circle cx={0} cy={0} r={26} className="fill-lab-mint/30 stroke-lab-mint" strokeWidth={2} />,
      },
      {
        x: 835,
        id: 2,
        art: (
          <rect
            x={-26}
            y={-26}
            width={52}
            height={52}
            rx={8}
            className="fill-lab-violet/25 stroke-lab-violet"
            strokeWidth={2}
          />
        ),
      },
      {
        x: 1005,
        id: 3,
        art: <path d="M 0 -28 L 26 20 L -26 20 Z" className="fill-lab-error/20 stroke-lab-error" strokeWidth={2} />,
      },
    ].map(card => (
      <g key={card.id}>
        <rect
          x={card.x}
          y={150}
          width={140}
          height={330}
          rx={14}
          className="fill-lab-inset stroke-lab-border-strong"
          strokeWidth={1.5}
        />
        <Mono x={card.x + 70} y={190} size={16} anchor="middle" className="fill-lab-text">
          #{card.id}
        </Mono>
        <g transform={`translate(${card.x + 70}, 290)`}>{card.art}</g>
        <Mono x={card.x + 70} y={400} size={13} anchor="middle">
          owner
        </Mono>
        <Mono x={card.x + 70} y={424} size={13} anchor="middle" className="fill-lab-violet">
          0x{(0xa1 + card.id * 7).toString(16)}…{(0x11 * card.id).toString(16).padStart(2, "0")}
        </Mono>
        <line x1={card.x + 20} y1={370} x2={card.x + 120} y2={370} className="stroke-lab-border" />
      </g>
    ))}
    <defs>
      <marker
        id="arrow-muted"
        viewBox="0 0 10 10"
        refX={8}
        refY={5}
        markerWidth={7}
        markerHeight={7}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lab-muted" />
      </marker>
    </defs>
  </Frame>
);

// Ch1 · What's actually on-chain — the tiny on-chain record on the left, the
// heavy metadata + art it points to off on IPFS, connected by one arrow.
export const TokenAnatomy = ({ children }: Props) => (
  <Frame
    label="An on-chain record holding only a token id, an owner address, and a tokenURI, with an arrow pointing off-chain to an IPFS JSON file and the image it references — the art itself never lives on the blockchain."
    viewBox="0 0 1200 560"
    overlay={children}
  >
    {/* chain of blocks, left */}
    {[0, 1, 2].map(i => (
      <rect
        key={i}
        x={50 + i * 24}
        y={110 + i * 20}
        width={330}
        height={300}
        rx={16}
        className={i < 2 ? "fill-lab-inset stroke-lab-border" : "fill-lab-surface stroke-lab-violet"}
        strokeWidth={i < 2 ? 1 : 2}
      />
    ))}
    <Mono x={130} y={120} size={16} className="fill-lab-muted">
      on-chain · ~hundreds of bytes
    </Mono>
    <Mono x={130} y={210} size={17} className="fill-lab-text">
      tokenId
    </Mono>
    <Mono x={410} y={210} size={17} anchor="end" className="fill-lab-mint">
      1
    </Mono>
    <Mono x={130} y={265} size={17} className="fill-lab-text">
      owner
    </Mono>
    <Mono x={410} y={265} size={17} anchor="end" className="fill-lab-violet">
      0x3f8a…c21b
    </Mono>
    <Mono x={130} y={320} size={17} className="fill-lab-text">
      tokenURI
    </Mono>
    <Mono x={410} y={345} size={15} anchor="end" className="fill-lab-violet">
      ipfs://QmfVM…R5Xr
    </Mono>
    <line x1={130} y1={232} x2={410} y2={232} className="stroke-lab-border" />
    <line x1={130} y1={287} x2={410} y2={287} className="stroke-lab-border" />

    {/* the pointer arrow */}
    <path
      d="M 425 330 C 530 330, 560 280, 650 280"
      fill="none"
      className="stroke-lab-mint"
      strokeWidth={3}
      strokeDasharray="8 7"
      markerEnd="url(#arrow-mint)"
    />
    <Mono x={535} y={255} size={14} anchor="middle" className="fill-lab-mint">
      points to
    </Mono>

    {/* IPFS side, right */}
    <Mono x={880} y={120} size={16} anchor="middle" className="fill-lab-muted">
      off-chain · IPFS · content-addressed
    </Mono>
    <rect
      x={660}
      y={150}
      width={250}
      height={260}
      rx={16}
      className="fill-lab-surface stroke-lab-border-strong"
      strokeWidth={1.5}
    />
    <Mono x={685} y={190} size={15} className="fill-lab-muted">
      QmfVM…R5Xr
    </Mono>
    <Mono x={685} y={235} size={16} className="fill-lab-text">
      {'{ "name": "Buffalo",'}
    </Mono>
    <Mono x={705} y={265} size={16} className="fill-lab-text">
      {'"image":'}
    </Mono>
    <Mono x={705} y={293} size={15} className="fill-lab-violet">
      {'"ipfs://QmYd…" }'}
    </Mono>
    <path
      d="M 915 290 C 960 290, 960 290, 985 290"
      fill="none"
      className="stroke-lab-mint"
      strokeWidth={3}
      strokeDasharray="8 7"
      markerEnd="url(#arrow-mint)"
    />
    {/* the art */}
    <rect
      x={990}
      y={180}
      width={170}
      height={220}
      rx={16}
      className="fill-lab-inset stroke-lab-border-strong"
      strokeWidth={1.5}
    />
    <circle cx={1075} cy={260} r={42} className="fill-lab-mint/25 stroke-lab-mint" strokeWidth={2.5} />
    <path d="M 1010 380 Q 1075 320 1140 380" fill="none" className="stroke-lab-violet" strokeWidth={2.5} />
    <Mono x={1075} y={430} size={14} anchor="middle">
      the actual image
    </Mono>
    <defs>
      <marker
        id="arrow-mint"
        viewBox="0 0 10 10"
        refX={8}
        refY={5}
        markerWidth={7}
        markerHeight={7}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lab-mint" />
      </marker>
    </defs>
  </Frame>
);

// Ch2 · The diamond — three parents implementing the same hooks, one child
// forced to name them all.
export const InheritanceDiamond = ({ children }: Props) => (
  <Frame
    label="An inheritance diagram: ERC721 at the top, ERC721Enumerable and ERC721URIStorage both extending it, and YourCollectible at the bottom inheriting from all three. The same function names appear in more than one parent, so the child must resolve the conflict explicitly."
    viewBox="0 0 1200 620"
    overlay={children}
  >
    {/* edges first, under the boxes */}
    <g className="stroke-lab-border-strong" strokeWidth={2}>
      <line x1={600} y1={130} x2={320} y2={250} />
      <line x1={600} y1={130} x2={880} y2={250} />
      <line x1={320} y1={340} x2={600} y2={470} />
      <line x1={880} y1={340} x2={600} y2={470} />
      <line x1={600} y1={130} x2={600} y2={470} />
    </g>

    {/* ERC721 */}
    <rect
      x={460}
      y={40}
      width={280}
      height={90}
      rx={14}
      className="fill-lab-surface stroke-lab-violet"
      strokeWidth={2}
    />
    <Mono x={600} y={78} size={20} anchor="middle" className="fill-lab-text font-semibold">
      ERC721
    </Mono>
    <Mono x={600} y={106} size={14} anchor="middle" className="fill-lab-violet">
      _update() · tokenURI()
    </Mono>

    {/* Enumerable */}
    <rect
      x={140}
      y={250}
      width={360}
      height={90}
      rx={14}
      className="fill-lab-surface stroke-lab-violet"
      strokeWidth={2}
    />
    <Mono x={320} y={288} size={19} anchor="middle" className="fill-lab-text font-semibold">
      ERC721Enumerable
    </Mono>
    <Mono x={320} y={316} size={14} anchor="middle" className="fill-lab-violet">
      _update() — again
    </Mono>

    {/* URIStorage */}
    <rect
      x={700}
      y={250}
      width={360}
      height={90}
      rx={14}
      className="fill-lab-surface stroke-lab-violet"
      strokeWidth={2}
    />
    <Mono x={880} y={288} size={19} anchor="middle" className="fill-lab-text font-semibold">
      ERC721URIStorage
    </Mono>
    <Mono x={880} y={316} size={14} anchor="middle" className="fill-lab-violet">
      tokenURI() — again
    </Mono>

    {/* the child */}
    <rect
      x={380}
      y={470}
      width={440}
      height={110}
      rx={14}
      className="fill-lab-violet/10 stroke-lab-mint"
      strokeWidth={2.5}
    />
    <Mono x={600} y={512} size={20} anchor="middle" className="fill-lab-text font-semibold">
      YourCollectible
    </Mono>
    <Mono x={600} y={545} size={14} anchor="middle" className="fill-lab-mint">
      override(ERC721, ERC721Enumerable) → super
    </Mono>

    {/* conflict badges on the duplicated members */}
    <g>
      <circle cx={478} cy={282} r={13} className="fill-lab-error/20 stroke-lab-error" strokeWidth={2} />
      <Mono x={478} y={288} size={15} anchor="middle" className="fill-lab-error">
        !
      </Mono>
      <circle cx={1038} cy={282} r={13} className="fill-lab-error/20 stroke-lab-error" strokeWidth={2} />
      <Mono x={1038} y={288} size={15} anchor="middle" className="fill-lab-error">
        !
      </Mono>
    </g>
  </Frame>
);

// Ch3 · The vault and the gallery — the same mint, two very different receivers.
export const VaultAndGallery = ({ children }: Props) => (
  <Frame
    label="A token being delivered to two contracts. The NaiveVault has no onERC721Received: the safe mint bounces off and reverts, sparing the token. The FriendlyGallery answers the delivery check with the magic value and receives the token."
    viewBox="0 0 1200 560"
    overlay={children}
  >
    {/* the minter */}
    <circle cx={160} cy={280} r={54} className="fill-lab-violet/15 stroke-lab-violet" strokeWidth={2} />
    <Mono x={160} y={272} size={15} anchor="middle" className="fill-lab-text">
      mintItem
    </Mono>
    <Mono x={160} y={296} size={13} anchor="middle" className="fill-lab-violet">
      _safeMint
    </Mono>

    {/* to the vault: bounced */}
    <path
      d="M 225 240 C 350 150, 480 150, 590 185"
      fill="none"
      className="stroke-lab-error"
      strokeWidth={3}
      strokeDasharray="8 7"
      markerEnd="url(#arrow-err)"
    />
    <Mono x={400} y={140} size={14} anchor="middle" className="fill-lab-error">
      onERC721Received? …no answer → revert
    </Mono>
    <rect
      x={620}
      y={80}
      width={480}
      height={180}
      rx={16}
      className="fill-lab-surface stroke-lab-border-strong"
      strokeWidth={1.5}
    />
    <Mono x={660} y={125} size={19} className="fill-lab-text font-semibold">
      NaiveVault
    </Mono>
    <Mono x={660} y={157} size={14}>
      receive() external payable — ETH only
    </Mono>
    <Mono x={660} y={185} size={14} className="fill-lab-error">
      no onERC721Received
    </Mono>
    <Mono x={660} y={213} size={14}>
      no function can ever send a token out
    </Mono>
    {/* closed slot */}
    <rect x={1030} y={140} width={40} height={8} rx={4} className="fill-lab-error/60" />

    {/* to the gallery: accepted */}
    <path
      d="M 225 320 C 350 410, 480 410, 590 380"
      fill="none"
      className="stroke-lab-mint"
      strokeWidth={3}
      markerEnd="url(#arrow-mint2)"
    />
    <Mono x={400} y={445} size={14} anchor="middle" className="fill-lab-mint">
      onERC721Received → magic value → accepted
    </Mono>
    <rect
      x={620}
      y={300}
      width={480}
      height={180}
      rx={16}
      className="fill-lab-surface stroke-lab-mint"
      strokeWidth={2}
    />
    <Mono x={660} y={345} size={19} className="fill-lab-text font-semibold">
      FriendlyGallery
    </Mono>
    <Mono x={660} y={377} size={14} className="fill-lab-mint">
      onERC721Received(…) returns (bytes4)
    </Mono>
    <Mono x={660} y={405} size={14}>
      answers the delivery check, takes the token
    </Mono>
    {/* the token, safely inside */}
    <circle cx={1040} cy={400} r={30} className="fill-lab-mint/25 stroke-lab-mint" strokeWidth={2} />
    <Mono x={1040} y={407} size={14} anchor="middle" className="fill-lab-mint">
      #1
    </Mono>
    <defs>
      <marker
        id="arrow-err"
        viewBox="0 0 10 10"
        refX={8}
        refY={5}
        markerWidth={7}
        markerHeight={7}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lab-error" />
      </marker>
      <marker
        id="arrow-mint2"
        viewBox="0 0 10 10"
        refX={8}
        refY={5}
        markerWidth={7}
        markerHeight={7}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lab-mint" />
      </marker>
    </defs>
  </Frame>
);

// Ch4 · Who can move a token — the owner, one approved address, or an operator
// approved for everything; everyone else is turned away by the contract.
export const WhoCanMoveIt = ({ children }: Props) => (
  <Frame
    label="A token #1 owned by Alice. Three arrows try to move it: Alice's own transfer succeeds; Bob, approved for this one token, succeeds; a stranger with no approval is rejected by the contract with a revert."
    viewBox="0 0 1200 560"
    overlay={children}
  >
    {/* the token in the middle-right */}
    <rect
      x={880}
      y={190}
      width={220}
      height={180}
      rx={16}
      className="fill-lab-surface stroke-lab-violet"
      strokeWidth={2}
    />
    <circle cx={990} cy={258} r={36} className="fill-lab-violet/20 stroke-lab-violet" strokeWidth={2} />
    <Mono x={990} y={265} size={16} anchor="middle" className="fill-lab-violet">
      #1
    </Mono>
    <Mono x={990} y={330} size={14} anchor="middle">
      ownerOf(1) = alice
    </Mono>

    {/* actors */}
    {[
      { y: 110, name: "alice", note: "the owner", ok: true, badge: "owner" },
      { y: 280, name: "bob", note: "approve(bob, 1)", ok: true, badge: "approved" },
      { y: 450, name: "stranger", note: "no approval", ok: false, badge: "rejected" },
    ].map(actor => (
      <g key={actor.name}>
        <circle
          cx={170}
          cy={actor.y}
          r={46}
          className={actor.ok ? "fill-lab-mint/15 stroke-lab-mint" : "fill-lab-error/10 stroke-lab-error"}
          strokeWidth={2}
        />
        <Mono x={170} y={actor.y + 5} size={16} anchor="middle" className="fill-lab-text">
          {actor.name}
        </Mono>
        <Mono x={245} y={actor.y - 14} size={14} className={actor.ok ? "fill-lab-mint" : "fill-lab-error"}>
          {actor.badge}
        </Mono>
        <Mono x={245} y={actor.y + 10} size={13.5}>
          {actor.note}
        </Mono>
      </g>
    ))}

    {/* arrows: transferFrom attempts */}
    <path
      d="M 430 110 C 640 110, 760 180, 872 225"
      fill="none"
      className="stroke-lab-mint"
      strokeWidth={3}
      markerEnd="url(#arrow-mint3)"
    />
    <path
      d="M 430 280 C 620 280, 720 280, 872 280"
      fill="none"
      className="stroke-lab-mint"
      strokeWidth={3}
      markerEnd="url(#arrow-mint3)"
    />
    <path
      d="M 430 450 C 620 450, 720 400, 850 345"
      fill="none"
      className="stroke-lab-error"
      strokeWidth={3}
      strokeDasharray="8 7"
      markerEnd="url(#arrow-err2)"
    />
    <Mono x={640} y={92} size={13.5} anchor="middle" className="fill-lab-mint">
      transferFrom ✓
    </Mono>
    <Mono x={640} y={262} size={13.5} anchor="middle" className="fill-lab-mint">
      transferFrom ✓ (spends the approval)
    </Mono>
    <Mono x={640} y={490} size={13.5} anchor="middle" className="fill-lab-error">
      transferFrom ✗ ERC721InsufficientApproval
    </Mono>
    <defs>
      <marker
        id="arrow-mint3"
        viewBox="0 0 10 10"
        refX={8}
        refY={5}
        markerWidth={7}
        markerHeight={7}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lab-mint" />
      </marker>
      <marker
        id="arrow-err2"
        viewBox="0 0 10 10"
        refX={8}
        refY={5}
        markerWidth={7}
        markerHeight={7}
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-lab-error" />
      </marker>
    </defs>
  </Frame>
);
