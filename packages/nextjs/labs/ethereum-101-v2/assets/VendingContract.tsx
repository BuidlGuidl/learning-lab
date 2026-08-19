"use client";

// The vending machine from the card's illustration, but running. The machine's
// two rules are printed next to it in plain English (no code — this card is for
// non-coders), and the learner sets up the failure themselves:
//   • underpay        → the first rule stops it
//   • empty the shelf → the second one stops it, after the payment was fine
// Either way the coin drops back out of the return tray and the stock count
// hasn't moved: a failed rule undoes everything, including the payment. Pass
// both and the item drops, stock falls, and the contract keeps the ETH — same
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
const CHECK_STEP = 230; // ms between rules resolving, so they read one at a time

// dark-panel palette (the rail is dark in both themes), aligned to the lab tokens
const COLOR = {
  bodyTop: "#2a2340",
  bodyBottom: "#1b1528",
  line: "#3a3158",
  inset: "#14111c",
  faint: "#857c9e",
  muted: "#b3aac9",
  mint: "#54d6a8",
  peach: "#f0a868",
  magenta: "#ff7ccb",
  violet: "#a87dff",
};

type Mark = "idle" | "dim" | "pass" | "fail";

const RULES = ["Payment is at least 0.05 ETH", "There is a snack in stock"];

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

const eth = (n: number) => `${n.toFixed(2)} ETH`;

const INTRO = (
  <>
    The machine&apos;s rules are public and unchangeable. Anyone can read them, and no one can quietly rewrite them. The
    price is <strong>0.05 ETH</strong>. Click an amount to insert it.
  </>
);

// The full caption for each way the machine can refuse.
const failCaption = (index: number, amount: number): ReactNode =>
  [
    <>
      You sent <strong className="text-peach-bright">{eth(amount)}</strong> but the minimum price is{" "}
      <strong>0.05 ETH</strong>. So your money was never sent and the vending machine stock remains the same.
    </>,
    <>
      You sent <strong className="text-peach-bright">{eth(amount)}</strong> but the machine is out of stock. Your
      payment was fine, but the second rule failed, and a failed rule undoes everything. Your money came straight back
      and the vending machine stock remains the same.
    </>,
  ][index];

export const VendingContract = () => {
  const [pay, setPay] = useState(PRICE);
  const [stock, setStock] = useState(START_STOCK);
  const [balance, setBalance] = useState(0);
  const [dispensed, setDispensed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [marks, setMarks] = useState<Mark[]>(["idle", "idle"]);
  const [screen, setScreen] = useState({ text: "READY", tone: COLOR.mint });
  const [caption, setCaptionNode] = useState<ReactNode>(INTRO);
  // remounting the caption <p> (via key) replays its entrance animation, so a
  // changed message gets a visible nudge
  const [captionKey, setCaptionKey] = useState(0);
  const setCaption = (node: ReactNode) => {
    setCaptionNode(node);
    setCaptionKey(k => k + 1);
  };

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

  const clearMarks = () => setMarks(["idle", "idle"]);

  const reset = () => {
    stop();
    setPay(PRICE);
    setStock(START_STOCK);
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

  // tapping an amount is the whole transaction: it becomes the coin that drops in
  const buy = async (amount: number) => {
    if (busy) return;
    const id = ++runId.current;
    const alive = () => id === runId.current;

    setPay(amount);
    setBusy(true);
    setMarks(["dim", "dim"]);
    setScreen({ text: "...", tone: COLOR.peach });

    // the coin drops into the slot
    setCoin({ x: 158, y: -20, shown: true });
    await tween(520, easeInCubic, p => setCoin({ x: 158, y: -20 + p * 100, shown: true }));
    if (!alive()) return;
    setCoin(c => ({ ...c, shown: false }));

    const passes = [amount >= PRICE, stock > 0];
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
      setScreen({ text: "NO SALE", tone: COLOR.magenta });
      await tween(
        480,
        t => t,
        p => setShake(Math.sin(p * Math.PI * 6) * 5 * (1 - p)),
      );
      if (!alive()) return;
      setShake(0);

      // the coin comes back out of the return tray — the revert, made physical
      setCoin({ x: 159, y: 84, shown: true });
      await tween(680, easeOutBounce, p => setCoin({ x: 159, y: 84 + p * 79, shown: true }));
      if (!alive()) return;

      setCaption(failCaption(failed, amount));
      setBusy(false);
      return;
    }

    // every condition held, so the contract ran to the end and the state moved
    const nextStock = stock - 1;
    const nextBalance = balance + amount;
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
      amount > PRICE ? (
        <>
          Both rules passed, so the machine finished the job: stock dropped to <strong>{nextStock}</strong> and the
          contract now holds <strong className="text-mint-bright">{eth(nextBalance)}</strong>. Notice it kept your whole{" "}
          <strong>{eth(amount)}</strong>. The rule only says pay <strong>at least 0.05 ETH</strong>, and the machine
          gives no change.
        </>
      ) : (
        <>
          Both rules passed, so the machine finished the job: stock dropped to <strong>{nextStock}</strong> and the
          contract now holds <strong className="text-mint-bright">{eth(nextBalance)}</strong>.
        </>
      ),
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
        aria-label={`A vending machine holding ${stock} snacks, with a screen reading ${screen.text}, a coin slot, a return tray and a dispense tray.`}
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

        {/* right column: two-line screen, coin slot, keypad */}
        <rect x={134} y={26} width={48} height={40} rx={5} fill={COLOR.inset} stroke={COLOR.line} />
        <text
          x={158}
          y={42}
          textAnchor="middle"
          fontFamily="monospace"
          fontSize={9}
          fill={screen.tone}
          aria-live="polite"
        >
          {screen.text}
        </text>
        <text x={158} y={57} textAnchor="middle" fontFamily="monospace" fontSize={7.5} fill={COLOR.muted}>
          stock {stock}
        </text>

        <rect x={146} y={78} width={24} height={5} rx={2.5} fill={COLOR.inset} stroke={COLOR.line} />
        <text x={158} y={94} textAnchor="middle" fontFamily="monospace" fontSize={6.5} fill={COLOR.faint}>
          COIN
        </text>

        <g fill={COLOR.bodyTop} stroke={COLOR.line} strokeWidth={0.8}>
          {[106, 121].map(y =>
            [140, 156].map(x => <rect key={`${x}-${y}`} x={x} y={y} width={12} height={10} rx={2} />),
          )}
        </g>

        <rect x={136} y={150} width={46} height={26} rx={5} fill={COLOR.inset} stroke={COLOR.line} />
        {/* label sits below the tray so the refunded coin never covers it */}
        <text x={159} y={184} textAnchor="middle" fontFamily="monospace" fontSize={6.5} fill={COLOR.faint}>
          RETURN
        </text>

        <rect x={18} y={190} width={164} height={52} rx={7} fill={COLOR.inset} stroke={COLOR.line} strokeWidth={1.4} />
        <rect x={18} y={190} width={164} height={7} rx={3} fill={COLOR.bodyBottom} />
        {Array.from({ length: dispensed }, (_, i) => (
          <rect key={i} x={TRAY_X - i * TRAY_STEP} y={TRAY_Y} width={26} height={18} rx={4} fill={COLOR.mint} />
        ))}

        {coin.shown && (
          <>
            <circle cx={coin.x} cy={coin.y} r={7} fill={COLOR.peach} stroke={COLOR.inset} strokeWidth={1.2} />
            {/* the amount is stamped on the coin itself, so it never overlaps the machine */}
            <text
              x={coin.x}
              y={coin.y + 1.8}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize={5}
              fontWeight="bold"
              fill={COLOR.inset}
            >
              {pay.toFixed(2).slice(1)}
            </text>
          </>
        )}
        {snack.shown && <rect x={snack.x} y={snack.y} width={26} height={18} rx={4} fill={COLOR.mint} />}
      </svg>

      <div
        className="rounded-xl border border-dark-border bg-dark-bg/60 p-3 text-xs leading-relaxed"
        aria-label="The machine's rules, with each one checked as it runs."
      >
        <div className="text-dark-text-faint">The vending machine&apos;s rules</div>
        {RULES.map((rule, i) => (
          <div key={rule} className={`-mx-1 flex items-center gap-2 rounded px-1 ${markClass[marks[i]]}`}>
            <span className={`w-3 shrink-0 text-center font-bold ${glyphClass[marks[i]]}`}>{MARK_GLYPH[marks[i]]}</span>
            <span>{rule}</span>
          </div>
        ))}
        <div className="pl-5 text-dark-text-muted">
          If both rules pass, a snack drops and the machine keeps your ETH. If either rule fails, your ETH comes back.
        </div>
      </div>

      {/* one segmented control, so it reads as a single choice rather than three
          independent buttons, with the call that spends it sitting beside it */}
      {/* one tap = one payment: each button inserts that amount straight into
          the machine, no separate confirm step */}
      <div className="flex flex-wrap items-center gap-3">
        {AMOUNTS.map(amount => (
          <button
            key={amount}
            type="button"
            onClick={() => buy(amount)}
            disabled={busy}
            className="cursor-pointer rounded-lg bg-violet-bright px-4 py-2 font-mono text-sm font-semibold text-[#1a102c] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert {eth(amount)}
          </button>
        ))}
      </div>

      <p
        key={captionKey}
        className="m-0 min-h-[3.5rem] animate-caption-in text-sm leading-relaxed text-dark-text-muted"
      >
        {caption}
      </p>

      <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-lab-code-panel-tint px-3 py-2 text-xs leading-snug text-dark-text-muted">
        <LightBulbIcon className="h-4 w-4 shrink-0 text-violet-bright" />
        <span>
          <strong className="font-semibold text-dark-text">Tip</strong>: try underpaying, overpaying, and buying when
          the machine is empty to see how it responds.
        </span>
      </div>
    </div>
  );
};
