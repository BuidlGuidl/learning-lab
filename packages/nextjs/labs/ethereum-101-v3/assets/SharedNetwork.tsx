"use client";

import { useState } from "react";
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, SignalSlashIcon } from "@heroicons/react/24/outline";

type NodeStatus = "online" | "offline" | "rejected";
type NetworkNode = {
  id: number;
  status: NodeStatus;
  value: number;
};

const START_VALUE = 7;
const freshNodes = (): NetworkNode[] =>
  Array.from({ length: 6 }, (_, index) => ({ id: index + 1, status: "online", value: START_VALUE }));

const INTRO =
  "Every online node has independently verified the same state. Try a valid update, remove one node, or make one node report a fake value.";

export const SharedNetwork = () => {
  const [sharedValue, setSharedValue] = useState(START_VALUE);
  const [nodes, setNodes] = useState<NetworkNode[]>(freshNodes);
  const [caption, setCaption] = useState(INTRO);

  const updateState = () => {
    const next = sharedValue + 1;
    setSharedValue(next);
    setNodes(current => current.map(node => (node.status === "online" ? { ...node, value: next } : node)));
    setCaption(
      `The valid update produced STATE ${next}. Every online node verified the same result; an offline node will catch up when it reconnects.`,
    );
  };

  const toggleOffline = () => {
    setNodes(current =>
      current.map(node => {
        if (node.id !== 2) return node;
        return node.status === "offline"
          ? { ...node, status: "online", value: sharedValue }
          : { ...node, status: "offline" };
      }),
    );
    const isOffline = nodes.find(node => node.id === 2)?.status === "offline";
    setCaption(
      isOffline
        ? "Node 2 rejoined, checked the network, and synchronized with the accepted state."
        : "Node 2 went offline. The other independent nodes still verify updates, so there is no single off switch.",
    );
  };

  const fakeState = () => {
    setNodes(current => current.map(node => (node.id === 5 ? { ...node, status: "rejected", value: 99 } : node)));
    setCaption(
      `Node 5 reported STATE 99, but the other nodes independently computed STATE ${sharedValue}. The fake result is rejected; it does not become shared history.`,
    );
  };

  const resyncRejected = () => {
    setNodes(current =>
      current.map(node => (node.status === "rejected" ? { ...node, status: "online", value: sharedValue } : node)),
    );
    setCaption("Node 5 discarded its divergent state and synchronized with the state accepted by the network.");
  };

  const reset = () => {
    setSharedValue(START_VALUE);
    setNodes(freshNodes());
    setCaption(INTRO);
  };

  const nodeTwoOffline = nodes.find(node => node.id === 2)?.status === "offline";
  const hasRejectedNode = nodes.some(node => node.status === "rejected");

  return (
    <div className="flex flex-col gap-4 text-dark-text">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-dark-border bg-lab-code-panel-tint px-3 py-1 font-mono text-xs">
          <span className="text-dark-text-muted">accepted state</span>
          <strong className="font-semibold text-dark-text">STATE {sharedValue}</strong>
        </span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer font-mono text-xs text-dark-text-muted transition-colors hover:text-dark-text"
        >
          reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {nodes.map(node => {
          const offline = node.status === "offline";
          const rejected = node.status === "rejected";
          return (
            <div
              key={node.id}
              className={`rounded-xl border px-3 py-3 transition-colors ${
                rejected
                  ? "border-error/60 bg-error/10"
                  : offline
                    ? "border-dark-border border-dashed bg-dark-bg/40 opacity-60"
                    : "border-violet-bright/45 bg-lab-code-panel-tint"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-dark-text-muted">NODE {node.id}</span>
                {rejected ? (
                  <ExclamationTriangleIcon className="h-4 w-4 text-error" />
                ) : offline ? (
                  <SignalSlashIcon className="h-4 w-4 text-dark-text-faint" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 text-lab-mint" />
                )}
              </div>
              <p className={`m-0 font-mono text-lg font-semibold ${rejected ? "text-error" : "text-dark-text"}`}>
                {offline ? "offline" : node.value}
              </p>
              {rejected && <p className="m-0 mt-1 text-[10px] uppercase tracking-wide text-error">rejected</p>}
            </div>
          );
        })}
      </div>

      <p className="m-0 min-h-[4.5rem] text-sm leading-relaxed text-dark-text-muted">{caption}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={updateState}
          className="btn btn-sm border-0 bg-violet-bright text-[#1a102c] hover:bg-violet-bright/90"
        >
          Accept a valid update
        </button>
        <button
          type="button"
          onClick={toggleOffline}
          className="btn btn-sm border-dark-border bg-lab-code-panel-tint text-dark-text hover:border-violet-bright"
        >
          {nodeTwoOffline ? "Reconnect node 2" : "Take node 2 offline"}
        </button>
        <button
          type="button"
          onClick={hasRejectedNode ? resyncRejected : fakeState}
          className="btn btn-sm border-dark-border bg-lab-code-panel-tint text-dark-text hover:border-violet-bright"
        >
          {hasRejectedNode ? (
            <>
              <ArrowPathIcon className="h-4 w-4" /> Resync node 5
            </>
          ) : (
            "Fake node 5's state"
          )}
        </button>
      </div>
    </div>
  );
};
