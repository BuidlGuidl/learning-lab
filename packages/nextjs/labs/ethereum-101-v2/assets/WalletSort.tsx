"use client";

import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

type Zone = "yours" | "network";

type SortItem = {
  label: string;
  zone: Zone;
  feedback: string;
};

const ITEMS: SortItem[] = [
  {
    label: "Private key",
    zone: "yours",
    feedback: "It stays with you. If it lived on Ethereum, everyone could copy it.",
  },
  {
    label: "Wallet app",
    zone: "yours",
    feedback: "The app is your interface. Ethereum keeps working if you replace the app.",
  },
  {
    label: "Recovery phrase backup",
    zone: "yours",
    feedback: "It recreates your keys. Keep it private and preferably offline.",
  },
  { label: "Account address", zone: "network", feedback: "The public address identifies the account on Ethereum." },
  {
    label: "ETH balance",
    zone: "network",
    feedback: "The shared ledger records the balance; the wallet only displays it.",
  },
  {
    label: "Transaction history",
    zone: "network",
    feedback: "Past transactions are part of the shared public history.",
  },
];

const ZONES: Array<{ id: Zone; title: string; detail: string }> = [
  { id: "yours", title: "Held by you / your wallet", detail: "Private tools, app, and backups" },
  { id: "network", title: "Recorded on Ethereum", detail: "Public shared state" },
];

export const WalletSort = () => {
  const [placed, setPlaced] = useState<Partial<Record<number, Zone>>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const pointerDrag = useRef<{ itemIndex: number; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const sortedCount = Object.keys(placed).length;
  const complete = sortedCount === ITEMS.length;

  const place = (itemIndex: number, zone: Zone) => {
    const item = ITEMS[itemIndex];

    if (item.zone !== zone) {
      setSelectedIndex(itemIndex);
      setFeedback({ correct: false, message: item.feedback });
      return;
    }

    setPlaced(previous => ({ ...previous, [itemIndex]: zone }));
    setSelectedIndex(null);
    setFeedback({ correct: true, message: item.feedback });
  };

  const chooseZone = (zone: Zone) => {
    if (selectedIndex !== null) place(selectedIndex, zone);
  };

  const handleZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>, zone: Zone) => {
    if (selectedIndex === null || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    chooseZone(zone);
  };

  const zoneAtPoint = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-wallet-zone]");
    const zone = element?.dataset.walletZone;
    return zone === "yours" || zone === "network" ? zone : null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, itemIndex: number) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDrag.current = { itemIndex, startX: event.clientX, startY: event.clientY, moved: false };
    suppressClick.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = pointerDrag.current;
    if (!drag) return;

    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) {
      drag.moved = true;
      setDraggedIndex(drag.itemIndex);
      setSelectedIndex(drag.itemIndex);
      setFeedback(null);
    }

    if (drag.moved) setActiveZone(zoneAtPoint(event.clientX, event.clientY));
  };

  const finishPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = pointerDrag.current;
    if (!drag) return;

    if (drag.moved) {
      suppressClick.current = true;
      const zone = zoneAtPoint(event.clientX, event.clientY);
      if (zone) place(drag.itemIndex, zone);
    }

    pointerDrag.current = null;
    setDraggedIndex(null);
    setActiveZone(null);
  };

  const cancelPointerDrag = () => {
    pointerDrag.current = null;
    setDraggedIndex(null);
    setActiveZone(null);
  };

  const reset = () => {
    setPlaced({});
    setSelectedIndex(null);
    setDraggedIndex(null);
    setActiveZone(null);
    setFeedback(null);
  };

  return (
    <div
      className="flex flex-col gap-4 text-dark-text"
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerDrag}
      onPointerCancel={cancelPointerDrag}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-dark-text-muted">
          wallet sort · {sortedCount}/{ITEMS.length} sorted
        </span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <div>
        <h3 className="m-0 text-lg font-semibold text-dark-text">What&apos;s actually inside the wallet?</h3>
        <p className="mb-0 mt-1 text-sm leading-relaxed text-dark-text-muted">
          Sort each item by where it actually lives.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-dark-border bg-dark-surface/40 p-3">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-dark-text-faint">
          Items to sort
        </span>
        <div className="flex flex-wrap gap-2">
          {ITEMS.map((item, itemIndex) =>
            placed[itemIndex] === undefined ? (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setSelectedIndex(current => (current === itemIndex ? null : itemIndex));
                  setFeedback(null);
                }}
                onPointerDown={event => handlePointerDown(event, itemIndex)}
                aria-pressed={selectedIndex === itemIndex}
                className={`touch-none cursor-grab rounded-lg border px-3 py-2 text-left text-xs font-semibold transition active:cursor-grabbing ${
                  selectedIndex === itemIndex
                    ? "border-violet-bright bg-violet-bright/15 text-violet-bright ring-2 ring-violet-bright/20"
                    : "border-dark-border bg-dark-bg text-dark-text hover:border-violet-bright/70"
                } ${draggedIndex === itemIndex ? "opacity-50" : ""}`}
              >
                {item.label}
              </button>
            ) : null,
          )}
          {complete && <span className="py-2 text-xs text-mint-bright">All items placed.</span>}
        </div>
      </div>

      <p className="m-0 text-xs text-dark-text-faint">Drag a card, or select it and then choose a destination.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {ZONES.map(zone => {
          const zoneItems = ITEMS.map((item, itemIndex) => ({ item, itemIndex })).filter(
            ({ itemIndex }) => placed[itemIndex] === zone.id,
          );
          const isActive = activeZone === zone.id;
          const isReady = selectedIndex !== null;

          return (
            <div
              key={zone.id}
              role="button"
              tabIndex={0}
              data-wallet-zone={zone.id}
              onClick={() => chooseZone(zone.id)}
              onKeyDown={event => handleZoneKeyDown(event, zone.id)}
              aria-label={`${zone.title}. ${zoneItems.length} item${zoneItems.length === 1 ? "" : "s"} placed.${
                isReady ? " Activate to place the selected item here." : ""
              }`}
              className={`min-h-36 rounded-xl border border-dashed p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-bright ${
                isActive
                  ? "border-violet-bright bg-violet-bright/15"
                  : isReady
                    ? "cursor-pointer border-violet-bright/60 bg-lab-code-panel-tint"
                    : "border-dark-border bg-dark-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-violet-bright">
                    {zone.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-dark-text-muted">{zone.detail}</span>
                </div>
                <span className="font-mono text-xs text-dark-text-faint">{zoneItems.length}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {zoneItems.map(({ item }) => (
                  <span
                    key={item.label}
                    className="rounded-lg border border-mint-bright/40 bg-mint-bright/10 px-2.5 py-1.5 text-xs font-semibold text-mint-bright"
                  >
                    ✓ {item.label}
                  </span>
                ))}
                {zoneItems.length === 0 && (
                  <span className="text-xs text-dark-text-faint">Drop or place items here</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!complete && feedback && (
        <div
          className="rounded-lg border border-dark-border bg-dark-surface p-3 text-sm leading-relaxed"
          aria-live="polite"
        >
          <strong className={feedback.correct ? "text-mint-bright" : "text-peach-bright"}>
            {feedback.correct ? "Correct." : "Try the other destination."}
          </strong>{" "}
          <span className="text-dark-text-muted">{feedback.message}</span>
        </div>
      )}

      {complete && (
        <div
          className="rounded-xl border border-mint-bright/30 bg-mint-bright/10 p-4 text-sm leading-relaxed text-dark-text-muted"
          aria-live="polite"
        >
          <strong className="text-dark-text">Wallet sort complete</strong>
          <p className="mb-0 mt-2">
            Your wallet manages your keys, backups, and interface. Ethereum records your address, ETH balance, and
            transaction history. Your wallet holds your key, not your money.
          </p>
        </div>
      )}
    </div>
  );
};
