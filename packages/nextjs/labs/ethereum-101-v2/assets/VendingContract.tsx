"use client";

// The vending machine from the card's illustration, but running. The contract's
// three `require` lines are printed next to the machine, and the learner sets up
// the conditions themselves:
//   • underpay        → the first require stops it on line one
//   • empty the shelf → the second one stops it, after the payment was fine
//   • close the window → the third one stops it, on nothing but the clock
// Whichever line fails, the coin drops back out of the return tray and `stock`
// hasn't moved: a revert undoes everything, including the payment. Pass all
// three and the item drops, stock falls, and the contract keeps the ETH — same
// input, same result, no clerk deciding whether to serve you.
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";

const PRICE = 0.05;
const START_STOCK = 3;
const AMOUNTS = [0.02, 0.05, 0.1];
const SHELF_Y = [46, 96, 146]; // top of each shelf row, in SVG units — one snack each
const SNACK_X = 57; // centred in the glass window, and the column the snack falls down
const TRAY_Y = 206;
const TRAY_X = 152; // the first bought snack slides all the way to the right of the tray
const TRAY_STEP = 32; // each later one stops one slot short, queueing leftwards
const CHECK_STEP = 230; // ms between require lines resolving, so they read one at a time

// dark-panel palette (the rail is dark in both themes), aligned to the lab tokens
const COLOR = {
  bodyTop: "#2a2340",
  bodyBottom: "#1b1528",
  line: "#3a3158",
  inset: "#14111c",
  faint: "#857c9e",
  mint: "#54d6a8",
  peach: "#f0a868",
  magenta: "#ff7ccb",
  violet: "#a87dff",
};

type Mark = "idle" | "dim" | "pass" | "fail";

const REQUIRES = ["require(msg.value >= 0.05 ether);", "require(stock > 0);", "require(block.timestamp < closesAt);"];

const MARK_GLYPH: Record<Mark, string> = { idle: "·", dim: "·", pass: "✓", fail: "✗" };

const easeInCubic = (t: number) => t * t * t;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// Classic bounce-out: the coin lands in the return tray, the snack lands in the
// dispense tray, and both settle instead of stopping dead.
function easeOutBounce(t: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

const Mono = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`font-mono ${className}`}>{children}</span>
);

const eth = (n: number) => `${n.toFixed(2)} ETH`;

const INTRO = (
  <>
    Every rule the machine follows is printed next to it. Choose what to send, then <strong>call buy()</strong>. Try
    underpaying — the machine will not improvise.
  </>
);

// Why each require stopped execution. The learner set the condition up, so the
// message names the line rather than the outcome.
const failReason = (index: number): ReactNode =>
  [
    <>
      The price is <Mono>0.05</Mono>, so the first <Mono>require</Mono> failed and execution stopped on line one.
    </>,
    <>
      The shelf is empty. The payment was fine, but the second <Mono>require</Mono> failed — and a failure anywhere
      undoes everything before it.
    </>,
    <>The sale window has closed. The money and the stock were both fine; the clock was not.</>,
  ][index];

export const VendingContract = () => {
  const [pay, setPay] = useState(PRICE);
  const [stock, setStock] = useState(START_STOCK);
  const [closed, setClosed] = useState(false);
  const [balance, setBalance] = useState(0);
  const [dispensed, setDispensed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [marks, setMarks] = useState<Mark[]>(["idle", "idle", "idle"]);
  const [screen, setScreen] = useState({ text: "READY", tone: COLOR.mint });
  const [caption, setCaption] = useState<ReactNode>(INTRO);

  const [coin, setCoin] = useState({ x: 158, y: -20, shown: false });
  const [snack, setSnack] = useState({ x: SNACK_X, y: 0, shown: false });
  const [shake, setShake] = useState(0);

  const raf = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // a run in flight checks this after every await and bails when it has moved,
  // so an abandoned animation can never write state again
  const runId = useRef(0);

  // cancels whatever is in flight: drop the frame loop and the pending timer,
  // and move the run id on so buy() stops at its next checkpoint
  const stop = () => {
    runId.current++;
    if (raf.current) cancelAnimationFrame(raf.current);
    if (timer.current) clearTimeout(timer.current);
    raf.current = null;
    timer.current = null;
  };
  useEffect(() => stop, []);

  const tween = (ms: number, ease: (t: number) => number, onFrame: (p: number) => void) =>
    new Promise<void>(resolve => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / ms);
        onFrame(ease(p));
        if (p < 1) raf.current = requestAnimationFrame(step);
        else resolve();
      };
      raf.current = requestAnimationFrame(step);
    });

  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      timer.current = setTimeout(resolve, ms);
    });

  const clearMarks = () => setMarks(["idle", "idle", "idle"]);

  const choose = (amount: number) => {
    if (busy) return;
    setPay(amount);
    clearMarks();
    setCaption(
      amount < PRICE ? (
        <>
          Sending <Mono className="text-peach-bright">{eth(amount)}</Mono>. The price is 0.05 — watch which line stops
          you.
        </>
      ) : (
        <>
          Sending <Mono>{eth(amount)}</Mono>. Anything above the price still works; the contract only checks{" "}
          <Mono>{">="}</Mono>.
        </>
      ),
    );
  };

  const toggleWindow = () => {
    if (busy) return;
    const next = !closed;
    setClosed(next);
    clearMarks();
    setCaption(
      next ? (
        <>
          The sale window is closed. Nothing about the machine changed — only the clock did, and the contract reads the
          clock too.
        </>
      ) : (
        <>The sale window is open again.</>
      ),
    );
  };

  const reset = () => {
    stop();
    setPay(PRICE);
    setStock(START_STOCK);
    setClosed(false);
    setBalance(0);
    setDispensed(0);
    setBusy(false);
    clearMarks();
    setScreen({ text: "READY", tone: COLOR.mint });
    setCoin({ x: 158, y: -20, shown: false });
    setSnack({ x: SNACK_X, y: 0, shown: false });
    setShake(0);
    setCaption(INTRO);
  };

  const buy = async () => {
    if (busy) return;
    const id = ++runId.current;
    const alive = () => id === runId.current;

    setBusy(true);
    setMarks(["dim", "dim", "dim"]);
    setScreen({ text: "...", tone: COLOR.peach });

    // the coin drops into the slot
    setCoin({ x: 158, y: -20, shown: true });
    await tween(520, easeInCubic, p => setCoin({ x: 158, y: -20 + p * 86, shown: true }));
    if (!alive()) return;
    setCoin(c => ({ ...c, shown: false }));

    const passes = [pay >= PRICE, stock > 0, !closed];
    let failed = -1;
    for (let i = 0; i < passes.length; i++) {
      await wait(CHECK_STEP);
      if (!alive()) return;
      setMarks(prev => prev.map((m, j) => (j === i ? (passes[i] ? "pass" : "fail") : m)));
      if (!passes[i]) {
        failed = i;
        break;
      }
    }

    if (failed !== -1) {
      setScreen({ text: "REVERT", tone: COLOR.magenta });
      await tween(
        480,
        t => t,
        p => setShake(Math.sin(p * Math.PI * 6) * 5 * (1 - p)),
      );
      if (!alive()) return;
      setShake(0);

      // the coin comes back out of the return tray — the revert, made physical
      setCoin({ x: 159, y: 70, shown: true });
      await tween(680, easeOutBounce, p => setCoin({ x: 159, y: 70 + p * 93, shown: true }));
      if (!alive()) return;

      setCaption(
        <>
          You sent <Mono className="text-peach-bright">{eth(pay)}</Mono>. {failReason(failed)} It came straight back and{" "}
          <Mono>stock</Mono> is still <strong>{stock}</strong>. Nothing half-happened.
        </>,
      );
      setBusy(false);
      return;
    }

    // every condition held, so the contract ran to the end and the state moved
    const nextStock = stock - 1;
    const nextBalance = balance + pay;
    setScreen({ text: "OK", tone: COLOR.mint });
    setStock(nextStock);
    setBalance(nextBalance);

    // the snack falls out of its shelf into the tray, then slides right until it
    // meets the ones already bought — the tray fills from the right edge inwards
    const from = SHELF_Y[Math.min(SHELF_Y.length - 1, nextStock)];
    const slot = TRAY_X - dispensed * TRAY_STEP;
    setSnack({ x: SNACK_X, y: from, shown: true });
    await tween(760, easeOutBounce, p => setSnack({ x: SNACK_X, y: from + p * (TRAY_Y - from), shown: true }));
    if (!alive()) return;
    await tween(420, easeOutCubic, p => setSnack({ x: SNACK_X + p * (slot - SNACK_X), y: TRAY_Y, shown: true }));
    if (!alive()) return;
    setSnack({ x: SNACK_X, y: 0, shown: false });
    setDispensed(d => d + 1);

    setCaption(
      <>
        All three conditions passed, so the contract ran to the end: <Mono>stock</Mono> dropped to{" "}
        <strong>{nextStock}</strong> and the contract now holds{" "}
        <Mono className="text-mint-bright">{eth(nextBalance)}</Mono>. Same input, same result, every time — no clerk, no
        discretion.
      </>,
    );
    setBusy(false);
  };

  const markClass: Record<Mark, string> = {
    idle: "text-dark-text-muted",
    dim: "text-dark-text-muted opacity-40",
    pass: "bg-mint-bright/10 text-dark-text",
    fail: "bg-magenta-bright/10 text-dark-text",
  };
  const glyphClass: Record<Mark, string> = {
    idle: "text-dark-text-faint",
    dim: "text-dark-text-faint",
    pass: "text-mint-bright",
    fail: "text-magenta-bright",
  };

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">contract holds</span>
          <strong className="font-semibold text-dark-text">{eth(balance)}</strong>
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
        viewBox="0 0 200 270"
        className="mx-auto h-auto w-full max-w-[15rem] select-none"
        style={{ transform: `translateX(${shake}px)` }}
        role="img"
        aria-label="A vending machine with a coin slot, three shelves of stock, a return tray and a dispense tray."
      >
        <defs>
          <linearGradient id="vc-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR.bodyTop} />
            <stop offset="100%" stopColor={COLOR.bodyBottom} />
          </linearGradient>
          <linearGradient id="vc-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLOR.violet} stopOpacity="0.16" />
            <stop offset="55%" stopColor={COLOR.violet} stopOpacity="0.04" />
            <stop offset="100%" stopColor={COLOR.violet} stopOpacity="0.12" />
          </linearGradient>
          <clipPath id="vc-clip">
            <rect x={18} y={26} width={104} height={150} rx={6} />
          </clipPath>
        </defs>

        <rect x={8} y={12} width={184} height={248} rx={16} fill="url(#vc-body)" stroke={COLOR.line} strokeWidth={2} />
        <rect
          x={18}
          y={26}
          width={104}
          height={150}
          rx={6}
          fill="url(#vc-glass)"
          stroke={COLOR.line}
          strokeWidth={1.4}
        />

        {/* one snack per shelf, so the window always shows exactly `stock` */}
        <g clipPath="url(#vc-clip)">
          {SHELF_Y.slice(0, stock).map((y, row) => (
            <rect key={row} x={SNACK_X} y={y} width={26} height={18} rx={4} fill={COLOR.mint} />
          ))}
        </g>

        <line x1={18} y1={76} x2={122} y2={76} stroke={COLOR.line} strokeWidth={1} />
        <line x1={18} y1={126} x2={122} y2={126} stroke={COLOR.line} strokeWidth={1} />

        {/* right column: screen, coin slot, keypad */}
        <rect x={134} y={26} width={48} height={26} rx={5} fill={COLOR.inset} stroke={COLOR.line} />
        <text
          x={158}
          y={43}
          textAnchor="middle"
          fontFamily="monospace"
          fontSize={9}
          fill={screen.tone}
          aria-live="polite"
        >
          {screen.text}
        </text>

        <rect x={146} y={64} width={24} height={5} rx={2.5} fill={COLOR.inset} stroke={COLOR.line} />
        <text x={158} y={80} textAnchor="middle" fontFamily="monospace" fontSize={6.5} fill={COLOR.faint}>
          COIN
        </text>

        <g fill={COLOR.bodyTop} stroke={COLOR.line} strokeWidth={0.8}>
          {[92, 107, 122].map(y =>
            [140, 156].map(x => <rect key={`${x}-${y}`} x={x} y={y} width={12} height={10} rx={2} />),
          )}
        </g>

        <rect x={136} y={150} width={46} height={26} rx={5} fill={COLOR.inset} stroke={COLOR.line} />
        <text x={159} y={166} textAnchor="middle" fontFamily="monospace" fontSize={6.5} fill={COLOR.faint}>
          RETURN
        </text>

        <rect x={18} y={190} width={164} height={52} rx={7} fill={COLOR.inset} stroke={COLOR.line} strokeWidth={1.4} />
        <rect x={18} y={190} width={164} height={7} rx={3} fill={COLOR.bodyBottom} />
        {Array.from({ length: dispensed }, (_, i) => (
          <rect key={i} x={TRAY_X - i * TRAY_STEP} y={TRAY_Y} width={26} height={18} rx={4} fill={COLOR.mint} />
        ))}

        {coin.shown && (
          <circle cx={coin.x} cy={coin.y} r={7} fill={COLOR.peach} stroke={COLOR.inset} strokeWidth={1.2} />
        )}
        {snack.shown && <rect x={snack.x} y={snack.y} width={26} height={18} rx={4} fill={COLOR.mint} />}
      </svg>

      <div
        className="rounded-xl border border-dark-border bg-dark-bg/60 p-3 font-mono text-xs leading-relaxed"
        aria-label="The contract source, with each condition highlighted as it runs."
      >
        <div className="text-dark-text-faint">{"// Snack.sol — anyone can read this"}</div>
        <div>
          <span className="text-violet-bright">function</span> buy(){" "}
          <span className="text-violet-bright">external</span> <span className="text-violet-bright">payable</span> {"{"}
        </div>
        {REQUIRES.map((source, i) => (
          <div key={source} className={`-mx-1 flex items-center gap-2 rounded px-1 ${markClass[marks[i]]}`}>
            <span className={`w-3 shrink-0 text-center font-bold ${glyphClass[marks[i]]}`}>{MARK_GLYPH[marks[i]]}</span>
            <span className="whitespace-nowrap">{source}</span>
          </div>
        ))}
        <div className="pl-5">stock -= 1;</div>
        <div className="pl-5">_dispense(msg.sender);</div>
        <div>{"}"}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {AMOUNTS.map(amount => (
          <button
            key={amount}
            type="button"
            onClick={() => choose(amount)}
            aria-pressed={pay === amount}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
              pay === amount
                ? "border-violet-bright bg-lab-code-panel-tint font-semibold text-dark-text"
                : "border-dark-border bg-dark-surface text-dark-text-muted hover:border-violet-bright hover:text-dark-text"
            }`}
          >
            send {amount.toFixed(2)} ETH
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-dark-text-muted">
        <span>machine state —</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border px-3 py-1">
          <span>stock</span>
          <strong className="font-semibold text-dark-text">{stock}</strong>
        </span>
        <button
          type="button"
          onClick={toggleWindow}
          aria-pressed={closed}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 transition-colors ${
            closed
              ? "border-violet-bright bg-lab-code-panel-tint font-semibold text-dark-text"
              : "border-dark-border bg-dark-surface text-dark-text-muted hover:border-violet-bright hover:text-dark-text"
          }`}
        >
          sale window: {closed ? "closed" : "open"}
        </button>
      </div>

      <p className="m-0 min-h-[3.5rem] text-sm leading-relaxed text-dark-text-muted">{caption}</p>

      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-violet-bright px-4 py-2.5 text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "running…" : "Call buy()"}
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-lab-code-panel-tint px-3 py-2 text-xs leading-snug text-dark-text-muted">
        <LightBulbIcon className="h-4 w-4 shrink-0 text-violet-bright" />
        <span>
          <strong className="font-semibold text-dark-text">Tip</strong>: buy all three snacks, or close the sale window,
          to make a different line fail.
        </span>
      </div>
    </div>
  );
};
