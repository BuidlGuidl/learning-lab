"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";

type Zone = "yours" | "network";

type SortItem = {
  label: string;
  zone: Zone;
  feedback: string;
};

type ZoneHit = {
  zone: Zone;
  element: HTMLElement;
};

type PointerDrag = {
  itemIndex: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  originElement: HTMLButtonElement;
  width: number;
  height: number;
  grabOffsetX: number;
  grabOffsetY: number;
  liftY: number;
  scrollContainer: HTMLElement | null;
};

const DRAG_START_THRESHOLD = 6;
const TOUCH_PREVIEW_LIFT = 56;
const AUTO_SCROLL_EDGE = 72;
const AUTO_SCROLL_MAX_SPEED = 14;
const DROP_SETTLE_MS = 200;

const findScrollableAncestor = (element: HTMLElement) => {
  let parent = element.parentElement;

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (/auto|scroll/.test(overflowY) && parent.scrollHeight > parent.clientHeight) return parent;
    parent = parent.parentElement;
  }

  return document.scrollingElement as HTMLElement | null;
};

const getPreviewTransform = (drag: PointerDrag, clientX: number, clientY: number, scale: number, rotation: number) =>
  `translate3d(${clientX - drag.grabOffsetX}px, ${clientY - drag.grabOffsetY - drag.liftY}px, 0) rotate(${rotation}deg) scale(${scale})`;

const ITEMS: SortItem[] = [
  {
    label: "Private key",
    zone: "yours",
    feedback: "It stays with you. If it lived on Ethereum, everyone could copy it.",
  },
  {
    label: "Wallet password / PIN",
    zone: "yours",
    feedback: "It only unlocks this wallet on this device. Ethereum never sees it, and it cannot recover your keys.",
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

const ZONES: Array<{ id: Zone; title: string }> = [
  { id: "yours", title: "Held by you / your wallet" },
  { id: "network", title: "Recorded on Ethereum" },
];

export const WalletSort = () => {
  const [placed, setPlaced] = useState<Partial<Record<number, Zone>>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const pointerDrag = useRef<PointerDrag | null>(null);
  const dragPreviewElement = useRef<HTMLButtonElement | null>(null);
  const pendingPreviewPosition = useRef<{ clientX: number; clientY: number } | null>(null);
  const previewFrame = useRef<number | null>(null);
  const autoScrollFrame = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const suppressClickTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const sortedCount = Object.keys(placed).length;
  const complete = sortedCount === ITEMS.length;

  useEffect(
    () => () => {
      if (previewFrame.current !== null) window.cancelAnimationFrame(previewFrame.current);
      if (autoScrollFrame.current !== null) window.cancelAnimationFrame(autoScrollFrame.current);
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
      if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
      dragPreviewElement.current?.remove();
    },
    [],
  );

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

  const zoneAtPoint = (x: number, y: number): ZoneHit | null => {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-wallet-zone]");
    const zone = element?.dataset.walletZone;
    return element && (zone === "yours" || zone === "network") ? { zone, element } : null;
  };

  const removeDragPreview = () => {
    dragPreviewElement.current?.remove();
    dragPreviewElement.current = null;
  };

  const stopPreviewFrame = () => {
    if (previewFrame.current !== null) window.cancelAnimationFrame(previewFrame.current);
    previewFrame.current = null;
    pendingPreviewPosition.current = null;
  };

  const createDragPreview = (drag: PointerDrag, clientX: number, clientY: number) => {
    removeDragPreview();
    const preview = drag.originElement.cloneNode(true) as HTMLButtonElement;
    preview.removeAttribute("aria-describedby");
    preview.removeAttribute("aria-pressed");
    preview.setAttribute("aria-hidden", "true");
    preview.setAttribute("data-wallet-drag-preview", "");
    preview.tabIndex = -1;
    preview.className =
      "pointer-events-none fixed left-0 top-0 z-[1000] inline-flex select-none items-center gap-2 rounded-lg border border-violet-bright/80 bg-dark-bg/95 px-3 py-2 text-left text-xs font-semibold text-dark-text shadow-2xl shadow-violet-bright/25 ring-2 ring-violet-bright/25 backdrop-blur-sm will-change-transform";
    preview.style.width = `${drag.width}px`;
    preview.style.minHeight = `${drag.height}px`;
    preview.style.opacity = "1";
    preview.style.transform = getPreviewTransform(drag, clientX, clientY, 1.04, -1.5);
    preview.style.transformOrigin = "center";
    preview.style.transition = "none";
    document.body.appendChild(preview);
    dragPreviewElement.current = preview;
  };

  const stopAutoScroll = () => {
    if (autoScrollFrame.current !== null) window.cancelAnimationFrame(autoScrollFrame.current);
    autoScrollFrame.current = null;
  };

  const queuePreviewPosition = (clientX: number, clientY: number) => {
    pendingPreviewPosition.current = { clientX, clientY };
    if (previewFrame.current !== null) return;

    previewFrame.current = window.requestAnimationFrame(() => {
      const position = pendingPreviewPosition.current;
      const preview = dragPreviewElement.current;
      const drag = pointerDrag.current;
      previewFrame.current = null;
      pendingPreviewPosition.current = null;
      if (!position || !preview || !drag) return;

      preview.style.transform = getPreviewTransform(drag, position.clientX, position.clientY, 1.04, -1.5);
    });
  };

  const startAutoScroll = () => {
    if (autoScrollFrame.current !== null) return;

    const tick = () => {
      const drag = pointerDrag.current;
      if (!drag?.moved || !drag.scrollContainer) {
        autoScrollFrame.current = null;
        return;
      }

      const isDocumentScroller =
        drag.scrollContainer === document.scrollingElement ||
        drag.scrollContainer === document.documentElement ||
        drag.scrollContainer === document.body;
      const bounds = isDocumentScroller
        ? { top: 0, bottom: window.innerHeight, height: window.innerHeight }
        : drag.scrollContainer.getBoundingClientRect();
      const edge = Math.min(AUTO_SCROLL_EDGE, bounds.height / 4);
      let scrollDelta = 0;

      if (drag.lastY < bounds.top + edge) {
        scrollDelta = -Math.ceil(((bounds.top + edge - drag.lastY) / edge) * AUTO_SCROLL_MAX_SPEED);
      } else if (drag.lastY > bounds.bottom - edge) {
        scrollDelta = Math.ceil(((drag.lastY - (bounds.bottom - edge)) / edge) * AUTO_SCROLL_MAX_SPEED);
      }

      if (scrollDelta !== 0) {
        if (isDocumentScroller) window.scrollBy({ top: scrollDelta });
        else drag.scrollContainer.scrollTop += scrollDelta;
        setActiveZone(zoneAtPoint(drag.lastX, drag.lastY)?.zone ?? null);
      }

      autoScrollFrame.current = window.requestAnimationFrame(tick);
    };

    autoScrollFrame.current = window.requestAnimationFrame(tick);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, itemIndex: number) => {
    if (event.button !== 0) return;
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = null;

    removeDragPreview();
    setDraggedIndex(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
    const requestedLift = event.pointerType === "touch" ? TOUCH_PREVIEW_LIFT : 0;

    pointerDrag.current = {
      itemIndex,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      originElement: event.currentTarget,
      width: bounds.width,
      height: bounds.height,
      grabOffsetX: event.clientX - bounds.left,
      grabOffsetY: event.clientY - bounds.top,
      liftY: Math.min(requestedLift, Math.max(0, event.clientY - bounds.height - 12)),
      scrollContainer: findScrollableAncestor(event.currentTarget),
    };
    suppressClick.current = false;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = pointerDrag.current;
    if (!drag) return;

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > DRAG_START_THRESHOLD) {
      drag.moved = true;
      setDraggedIndex(drag.itemIndex);
      setSelectedIndex(drag.itemIndex);
      setFeedback(null);
      createDragPreview(drag, event.clientX, event.clientY);
      startAutoScroll();
    }

    if (drag.moved) {
      event.preventDefault();
      queuePreviewPosition(event.clientX, event.clientY);
      setActiveZone(zoneAtPoint(event.clientX, event.clientY)?.zone ?? null);
    }
  };

  const settleDrag = (drag: PointerDrag, hit: ZoneHit | null, isCorrectDrop: boolean) => {
    const preview = dragPreviewElement.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !preview) {
      removeDragPreview();
      setDraggedIndex(null);
      return;
    }

    const originBounds = drag.originElement.getBoundingClientRect();
    let clientX = originBounds.left + drag.grabOffsetX;
    let clientY = originBounds.top + drag.grabOffsetY + drag.liftY;
    let scale = 1;

    if (hit && isCorrectDrop) {
      const bounds = hit.element.getBoundingClientRect();
      clientX = bounds.left + bounds.width / 2 - drag.width / 2 + drag.grabOffsetX;
      clientY = bounds.top + bounds.height / 2 - drag.height / 2 + drag.grabOffsetY + drag.liftY;
      scale = 0.78;
    }

    preview.style.transition = `transform ${DROP_SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${
      DROP_SETTLE_MS - 40
    }ms ease-out`;
    preview.style.opacity = "0";
    preview.style.transform = getPreviewTransform(drag, clientX, clientY, scale, 0);
    settleTimer.current = window.setTimeout(() => {
      removeDragPreview();
      setDraggedIndex(null);
      settleTimer.current = null;
    }, DROP_SETTLE_MS);
  };

  const finishPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = pointerDrag.current;
    if (!drag) return;

    if (drag.moved) {
      suppressClick.current = true;
      if (suppressClickTimer.current !== null) window.clearTimeout(suppressClickTimer.current);
      suppressClickTimer.current = window.setTimeout(() => {
        suppressClick.current = false;
        suppressClickTimer.current = null;
      }, 0);

      const hit = zoneAtPoint(event.clientX, event.clientY);
      const isCorrectDrop = hit?.zone === ITEMS[drag.itemIndex].zone;
      if (hit) place(drag.itemIndex, hit.zone);
      settleDrag(drag, hit, isCorrectDrop);
    }

    pointerDrag.current = null;
    stopPreviewFrame();
    stopAutoScroll();
    setActiveZone(null);
  };

  const cancelPointerDrag = () => {
    pointerDrag.current = null;
    stopPreviewFrame();
    stopAutoScroll();
    removeDragPreview();
    setDraggedIndex(null);
    setActiveZone(null);
  };

  const reset = () => {
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = null;
    pointerDrag.current = null;
    stopPreviewFrame();
    stopAutoScroll();
    setPlaced({});
    setSelectedIndex(null);
    setDraggedIndex(null);
    removeDragPreview();
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
                onDragStart={event => event.preventDefault()}
                draggable={false}
                aria-pressed={selectedIndex === itemIndex}
                aria-describedby="wallet-sort-instructions"
                className={`group inline-flex min-h-11 touch-none select-none items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-[color,background-color,border-color,box-shadow,opacity,transform] active:cursor-grabbing active:scale-[0.98] ${
                  selectedIndex === itemIndex
                    ? "cursor-grab border-violet-bright bg-violet-bright/15 text-violet-bright ring-2 ring-violet-bright/20"
                    : "cursor-grab border-dark-border bg-dark-bg text-dark-text hover:border-violet-bright/70 hover:bg-dark-surface"
                } ${draggedIndex === itemIndex ? "scale-[0.97] border-dashed opacity-25" : ""}`}
              >
                <span
                  className="grid h-4 w-3 shrink-0 grid-cols-2 place-content-center gap-0.5 opacity-45 transition-opacity group-hover:opacity-80"
                  aria-hidden
                >
                  {[0, 1, 2, 3, 4, 5].map(dot => (
                    <span key={dot} className="h-0.5 w-0.5 rounded-full bg-current" />
                  ))}
                </span>
                <span>{item.label}</span>
              </button>
            ) : null,
          )}
          {complete && <span className="py-2 text-xs text-mint-bright">All items placed.</span>}
        </div>
      </div>

      <p id="wallet-sort-instructions" className="m-0 text-xs text-dark-text-faint">
        Drag a card to a destination, or tap to select it and then tap a destination.
      </p>
      <p className="sr-only" aria-live="assertive">
        {draggedIndex !== null
          ? `Dragging ${ITEMS[draggedIndex].label}. Move to a destination and release to place it.`
          : ""}
      </p>

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
              className={`relative min-h-36 w-full rounded-xl border border-dashed p-4 text-left transition-[border-color,background-color,box-shadow,transform] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-bright ${
                isActive
                  ? "scale-[1.01] border-violet-bright bg-violet-bright/15 shadow-lg shadow-violet-bright/10 ring-1 ring-violet-bright/30"
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
                </div>
                <span
                  className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                    isActive
                      ? "border-violet-bright/60 bg-violet-bright/20 text-violet-bright"
                      : "border-dark-border text-dark-text-faint"
                  }`}
                >
                  {isActive ? "release" : zoneItems.length}
                </span>
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
                  <span className={`text-xs ${isActive ? "font-semibold text-violet-bright" : "text-dark-text-faint"}`}>
                    {isActive ? "Release to place here" : "Drop or place items here"}
                  </span>
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
            Your wallet manages your keys, local password or PIN, and recovery backup. Ethereum records your address,
            ETH balance, and transaction history. Your wallet holds your key, not your money.
          </p>
        </div>
      )}
    </div>
  );
};
