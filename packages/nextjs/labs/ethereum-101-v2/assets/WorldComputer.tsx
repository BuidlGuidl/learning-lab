"use client";

// The world computer, made visible. A globe of equal nodes — no center, no
// node bigger than the rest — each holding the same little block of state.
// Three beats map 1:1 to the concept card's three claims:
//   • Broadcast a change → it ripples node-to-node until every block agrees
//     ("one computer, the same state everywhere").
//   • Click a node → it drops offline, the rest carry on, it re-syncs on
//     return ("no off switch").
//   • Tamper a node → it turns rogue and the next broadcast overwrites it
//     ("no one can rewrite history").
// SVG with a viewBox so it stays crisp at any rail width; a gentle JS spin
// (paused while the pointer is over the globe, so the blocks are easy to hit).
import { useEffect, useMemo, useRef, useState } from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";

type Status = "ok" | "offline" | "tampered";
type NodeState = { value: number; status: Status; pulseAt: number };

const NODE_COUNT = 24;
const START_VALUE = 7;
const CENTER = 200;
const RADIUS = 150;
const SPIN = 0.0024; // radians per frame — ~8°/s, slow enough to click
const RIPPLE_STEP = 80; // ms between nodes adopting a broadcast
const PULSE_MS = 700; // life of the mint "just adopted" ring
const TILT = 0.42; // viewing the globe slightly from above, so it reads as a sphere

// dark-panel palette (the rail is dark in both themes), aligned to the lab tokens
const COLOR = {
  okFill: "rgb(168 125 255 / 0.16)",
  okStroke: "#a87dff",
  text: "#eee8ff",
  faint: "#766892",
  faintFill: "rgb(118 104 146 / 0.10)",
  rogue: "#ff7ccb",
  rogueFill: "rgb(255 124 203 / 0.16)",
  mint: "#54d6a8",
  globe: "#a87dff",
};

const dist3 = (a: Vec3, b: Vec3) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;

type Vec3 = { x: number; y: number; z: number };

// Spin a unit point around the vertical axis, then tilt it toward the viewer,
// and project orthographically to the 2D rail. Shared by the nodes and the
// globe wireframe so they move as one body. depth (z) is used only to dim.
function project(p: Vec3, rot: number) {
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const x1 = p.x * cr + p.z * sr;
  const z1 = -p.x * sr + p.z * cr;
  const ct = Math.cos(TILT);
  const st = Math.sin(TILT);
  const y2 = p.y * ct - z1 * st;
  const z2 = p.y * st + z1 * ct;
  return { sx: CENTER + x1 * RADIUS, sy: CENTER + y2 * RADIUS, depth: z2 };
}

const wirePath = (points: Vec3[], rot: number) =>
  points
    .map((p, i) => {
      const { sx, sy } = project(p, rot);
      return `${i === 0 ? "M" : "L"}${sx.toFixed(1)} ${sy.toFixed(1)}`;
    })
    .join(" ");

// Meridians (pole-to-pole) and latitude rings, as point samples — projected
// fresh each frame so the wireframe spins with the nodes.
function sphereWires(): Vec3[][] {
  const wires: Vec3[][] = [];
  for (let m = 0; m < 4; m++) {
    const a = (m / 4) * Math.PI;
    wires.push(
      Array.from({ length: 33 }, (_, s) => {
        const t = -Math.PI / 2 + (s / 32) * Math.PI;
        return { x: Math.cos(t) * Math.cos(a), y: Math.sin(t), z: Math.cos(t) * Math.sin(a) };
      }),
    );
  }
  for (const t0 of [-0.65, 0, 0.65]) {
    wires.push(
      Array.from({ length: 49 }, (_, s) => {
        const phi = (s / 48) * Math.PI * 2;
        return { x: Math.cos(t0) * Math.cos(phi), y: Math.sin(t0), z: Math.cos(t0) * Math.sin(phi) };
      }),
    );
  }
  return wires;
}

// Evenly spread points on a sphere (fibonacci) — no clustering, no pole bias.
function sphereBase(count: number): Vec3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * golden;
    return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
  });
}

// Each node linked to its 2 nearest peers — a faint web for the network feel.
function neighborPairs(base: Vec3[]): [number, number][] {
  const seen = new Set<string>();
  const pairs: [number, number][] = [];
  base.forEach((a, i) => {
    const nearest = base
      .map((b, j) => ({ j, d: dist3(a, b) }))
      .filter(o => o.j !== i)
      .sort((p, q) => p.d - q.d);
    for (let k = 0; k < 2; k++) {
      const j = nearest[k].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push(i < j ? [i, j] : [j, i]);
      }
    }
  });
  return pairs;
}

const freshNodes = (): NodeState[] =>
  Array.from({ length: NODE_COUNT }, () => ({ value: START_VALUE, status: "ok" as Status, pulseAt: 0 }));

const INTRO =
  "Each block is an independent computer holding the same shared state. Broadcast a change, drop a node, or tamper with one, and watch the network stay in sync.";

export const WorldComputer = () => {
  const base = useMemo(() => sphereBase(NODE_COUNT), []);
  const pairs = useMemo(() => neighborPairs(base), [base]);
  const wires = useMemo(() => sphereWires(), []);

  const [rot, setRot] = useState(0);
  // a render clock driven by the frame loop, so pulse fades stay pure (no
  // Date.now() in render) and keep playing even while the spin is paused
  const [clock, setClock] = useState(0);
  const [nodes, setNodes] = useState<NodeState[]>(freshNodes);
  const [consensus, setConsensus] = useState(START_VALUE);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState(INTRO);

  const spinning = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setClock(performance.now());
      if (spinning.current) setRot(r => r + SPIN);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const broadcast = () => {
    if (busy) return;
    setBusy(true);
    const next = consensus + 1;
    setConsensus(next);

    // ripple outward from a live node, nearest blocks adopting first
    const live = nodes.map((n, i) => ({ n, i })).filter(o => o.n.status !== "offline");
    const origin = live.length ? live[Math.floor(Math.random() * live.length)].i : 0;
    const order = base
      .map((b, i) => ({ i, d: dist3(b, base[origin]) }))
      .sort((a, b) => a.d - b.d)
      .map(o => o.i);

    order.forEach((i, k) => {
      const t = setTimeout(() => {
        setNodes(prev =>
          prev.map((n, j) =>
            j === i && n.status !== "offline" ? { value: next, status: "ok", pulseAt: performance.now() } : n,
          ),
        );
      }, k * RIPPLE_STEP);
      timers.current.push(t);
    });

    const offlineCount = nodes.filter(n => n.status === "offline").length;
    const done = setTimeout(
      () => {
        setBusy(false);
        setCaption(
          offlineCount > 0
            ? `Every live node now holds STATE ${next}. The ${offlineCount} offline node${
                offlineCount > 1 ? "s" : ""
              } will catch up on reconnect.`
            : `Every node now holds STATE ${next}. Change it once, agreed everywhere.`,
        );
      },
      order.length * RIPPLE_STEP + 150,
    );
    timers.current.push(done);
  };

  const tamper = () => {
    const candidates = nodes.map((n, i) => ({ n, i })).filter(o => o.n.status === "ok");
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)].i;
    setNodes(prev => prev.map((n, i) => (i === pick ? { ...n, status: "tampered" } : n)));
    setCaption(
      "One node faked its state. Its peers don't agree, so the network ignores it. Broadcast again and it's overwritten.",
    );
  };

  const toggleNode = (i: number) => {
    const node = nodes[i];
    if (node.status === "offline") {
      setNodes(prev =>
        prev.map((n, j) => (j === i ? { value: consensus, status: "ok", pulseAt: performance.now() } : n)),
      );
      setCaption("Back online — it snaps straight to the network's current state.");
    } else {
      setNodes(prev => prev.map((n, j) => (j === i ? { ...n, status: "offline" } : n)));
      setCaption("A node dropped off the network. No off switch here, the rest carry on without it.");
    }
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(false);
    setConsensus(START_VALUE);
    setNodes(freshNodes());
    setCaption(INTRO);
  };

  // project the rotating sphere to 2D; depth (z) only dims, never resizes — so
  // no node looks bigger than another, per the brief
  const now = clock;
  const placed = base.map((b, i) => ({ i, ...project(b, rot) })).sort((a, b) => a.depth - b.depth); // far blocks first (painter's order)

  const depthOpacity = (depth: number) => 0.5 + 0.5 * ((depth + 1) / 2);

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">shared state</span>
          <strong className="font-semibold text-dark-text">STATE {consensus}</strong>
        </span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <svg
        viewBox="0 0 400 400"
        className="mx-auto h-auto w-full max-w-[420px] select-none"
        role="img"
        aria-label="A globe of equal nodes, each showing the same shared state value."
        onPointerEnter={() => (spinning.current = false)}
        onPointerLeave={() => (spinning.current = true)}
      >
        <defs>
          <radialGradient id="wc-sphere" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#3d2c61" />
            <stop offset="62%" stopColor="#241640" />
            <stop offset="100%" stopColor="#160e26" />
          </radialGradient>
        </defs>

        {/* the globe body, its spinning wireframe, and a crisp silhouette */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#wc-sphere)" />
        {wires.map((pts, k) => (
          <path key={k} d={wirePath(pts, rot)} fill="none" stroke={COLOR.globe} strokeWidth={1} strokeOpacity={0.12} />
        ))}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={COLOR.globe}
          strokeOpacity={0.32}
          strokeWidth={1.2}
        />

        {pairs.map(([a, b], k) => {
          const pa = placed.find(p => p.i === a)!;
          const pb = placed.find(p => p.i === b)!;
          const live = nodes[a].status !== "offline" && nodes[b].status !== "offline";
          return (
            <line
              key={k}
              x1={pa.sx}
              y1={pa.sy}
              x2={pb.sx}
              y2={pb.sy}
              stroke={COLOR.globe}
              strokeWidth={1}
              strokeOpacity={live ? 0.22 : 0.08}
            />
          );
        })}

        {placed.map(p => {
          const n = nodes[p.i];
          const isOffline = n.status === "offline";
          const isRogue = n.status === "tampered";
          const stroke = isRogue ? COLOR.rogue : isOffline ? COLOR.faint : COLOR.okStroke;
          const fill = isRogue ? COLOR.rogueFill : isOffline ? COLOR.faintFill : COLOR.okFill;
          const textColor = isRogue ? COLOR.rogue : isOffline ? COLOR.faint : COLOR.text;
          const label = isRogue ? "✗" : `${n.value}`;
          const age = n.pulseAt ? now - n.pulseAt : Infinity;
          const showPulse = age < PULSE_MS;
          const grow = (age / PULSE_MS) * 6;

          return (
            <g
              key={p.i}
              transform={`translate(${p.sx} ${p.sy})`}
              opacity={isOffline ? depthOpacity(p.depth) * 0.6 : depthOpacity(p.depth)}
              className="cursor-pointer"
              onClick={() => toggleNode(p.i)}
              role="button"
              aria-label={`Node ${p.i + 1}, ${isRogue ? "rogue" : isOffline ? "offline" : "in sync"}. Click to ${
                isOffline ? "reconnect" : "take offline"
              }.`}
            >
              {showPulse && (
                <rect
                  x={-15 - grow}
                  y={-10 - grow}
                  width={30 + grow * 2}
                  height={20 + grow * 2}
                  rx={6}
                  fill="none"
                  stroke={COLOR.mint}
                  strokeWidth={1.5}
                  strokeOpacity={1 - age / PULSE_MS}
                />
              )}
              <rect
                x={-15}
                y={-10}
                width={30}
                height={20}
                rx={5}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.4}
                strokeDasharray={isOffline ? "3 3" : undefined}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontFamily="monospace"
                fill={textColor}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="m-0 min-h-[2.5rem] text-sm leading-relaxed text-dark-text-muted">{caption}</p>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={broadcast}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "broadcasting…" : "Broadcast a change"}
        </button>
        <button
          type="button"
          onClick={tamper}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dark-border bg-lab-code-panel-tint px-4 py-2.5 text-sm font-semibold text-dark-text transition hover:border-violet-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tamper a node
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-lab-code-panel-tint px-3 py-2 text-xs leading-snug text-dark-text-muted">
        <LightBulbIcon className="h-4 w-4 shrink-0 text-violet-bright" />
        <span>
          <strong className="font-semibold text-dark-text">Tip</strong>: click any node to drop it offline, then bring
          it back.
        </span>
      </div>
    </div>
  );
};
