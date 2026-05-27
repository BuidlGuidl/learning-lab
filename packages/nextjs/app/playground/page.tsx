"use client";

import { useState } from "react";
import type { NextPage } from "next";
import type { Abi } from "viem";
import { COUNTER_SOURCE } from "~~/lib/playground/counter-source";
import { compileSolidity } from "~~/lib/solc/solc";
import { type LogEntry, useTevm } from "~~/lib/tevm/useTevm";

const Playground: NextPage = () => {
  const tevm = useTevm();
  const [compiling, setCompiling] = useState(false);

  const displayStatus = compiling ? "compiling" : tevm.status;
  const busy = compiling || tevm.status === "deploying" || tevm.status === "calling";
  const deployed = tevm.address !== null;

  async function onDeploy() {
    setCompiling(true);
    tevm.log("info", "compiling Counter.sol…");
    try {
      const result = await compileSolidity(COUNTER_SOURCE);
      if (!result.ok) {
        for (const err of result.errors) tevm.log("err", err.trim());
        return;
      }
      const bytes = result.bytecode.length - 2; // strip 0x
      tevm.log("ok", `compiled — abi ${result.abi.length} entries, bytecode ${Math.round(bytes / 2)} bytes`);
      for (const w of result.warnings) tevm.log("info", `warning: ${w.trim()}`);
      await tevm.deploy(result.abi as Abi, result.bytecode);
    } catch (e) {
      // useTevm.deploy already logged + set error state; nothing more to do here
      void e;
    } finally {
      setCompiling(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">tevm playground</h1>
          <p className="text-sm opacity-70 mt-1">
            compile and run a Solidity contract entirely in the browser — no wallet, no testnet.
          </p>
        </div>
        <StatusBadge status={displayStatus} />
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-base">Counter.sol</h2>
            <textarea
              readOnly
              spellCheck={false}
              className="textarea textarea-bordered font-mono text-xs h-72 leading-relaxed bg-base-100"
              value={COUNTER_SOURCE}
            />
            <div className="card-actions mt-2">
              <button className="btn btn-primary btn-sm" onClick={onDeploy} disabled={busy || deployed}>
                {deployed ? "deployed" : "deploy"}
              </button>
              {deployed && (
                <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
                  reset chain
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-base">log</h2>
              {tevm.logs.length > 0 && (
                <button className="btn btn-ghost btn-xs" onClick={tevm.clearLogs}>
                  clear
                </button>
              )}
            </div>
            <LogStream entries={tevm.logs} />
          </div>
        </section>
      </div>

      {deployed && (
        <section className="card bg-base-200 mt-4">
          <div className="card-body">
            <h2 className="card-title text-base">call</h2>
            <p className="text-xs opacity-60 -mt-1">
              deployed at <code className="font-mono">{tevm.address}</code>
            </p>
            <div className="card-actions mt-2">
              <button
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() => tevm.call("increment", []).catch(() => {})}
              >
                increment()
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={busy}
                onClick={() => tevm.call("reset", []).catch(() => {})}
              >
                reset()
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={busy}
                onClick={() => tevm.read("count", []).catch(() => {})}
              >
                read count
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ready"
      ? "badge-success"
      : status === "error"
        ? "badge-error"
        : status === "idle"
          ? "badge-ghost"
          : "badge-info";
  return <span className={`badge ${cls} badge-lg`}>{status}</span>;
}

function LogStream({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="font-mono text-xs opacity-50 h-72 flex items-center justify-center">
        no events yet — hit deploy
      </div>
    );
  }
  return (
    <div className="font-mono text-xs h-72 overflow-y-auto bg-base-100 rounded p-2 space-y-1">
      {entries.map((e, i) => (
        <div key={i} className="flex gap-2">
          <span className="opacity-40 shrink-0">{fmtTs(e.ts)}</span>
          <span className={kindClass(e.kind)}>{prefix(e.kind)}</span>
          <span className="break-all">{e.text}</span>
        </div>
      ))}
    </div>
  );
}

function fmtTs(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

function kindClass(k: LogEntry["kind"]): string {
  if (k === "ok") return "text-success shrink-0";
  if (k === "err") return "text-error shrink-0";
  return "text-info shrink-0";
}

function prefix(k: LogEntry["kind"]): string {
  if (k === "ok") return "✓";
  if (k === "err") return "✗";
  return "·";
}

export default Playground;
