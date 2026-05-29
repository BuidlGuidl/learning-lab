"use client";

import { useState } from "react";
import type { NextPage } from "next";
import type { Abi } from "viem";
import { COUNTER_SOURCE } from "~~/lib/playground/counter-source";
import { compileSolidity } from "~~/lib/solc/solc";
import { useTevmContract } from "~~/lib/tevm/useTevmContract";
import { notification } from "~~/utils/scaffold-eth";

const Playground: NextPage = () => {
  const tevm = useTevmContract();
  // the compile phase is solc's, not useTevm's. tracked here so the deploy button stays disabled across both phases.
  const [compiling, setCompiling] = useState(false);
  const [count, setCount] = useState<bigint | null>(null);

  const busy = compiling || tevm.status === "deploying" || tevm.status === "calling";
  const deployed = tevm.address !== null;

  async function onReadCount() {
    try {
      const value = (await tevm.readContract("count", [])) as bigint;
      setCount(value);
    } catch {
      // error already toasted by useTevm
    }
  }

  // orchestrates compile -> deploy. useTevm toasts its own deploy result; here we toast the compile step.
  async function onDeploy() {
    setCompiling(true);
    const loadingId = notification.loading("compiling Counter.sol…");
    try {
      const result = await compileSolidity(COUNTER_SOURCE);
      notification.remove(loadingId);
      if (!result.ok) {
        notification.error(result.errors[0]?.trim() ?? "compile failed");
        return;
      }
      notification.success("compiled");
      await tevm.deploy(result.abi as Abi, result.bytecode);
    } catch {
      notification.remove(loadingId);
    } finally {
      setCompiling(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">tevm playground</h1>
        <p className="text-sm opacity-70 mt-1">
          compile and run a Solidity contract entirely in the browser. no wallet, no testnet.
        </p>
      </header>

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
                onClick={() => tevm.writeContract("increment", []).catch(() => {})}
              >
                increment()
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={busy}
                onClick={() => tevm.writeContract("reset", []).catch(() => {})}
              >
                reset()
              </button>
              <button className="btn btn-outline btn-sm" disabled={busy} onClick={onReadCount}>
                read count
              </button>
            </div>
            {count !== null && (
              <p className="text-sm mt-3">
                count: <code className="font-mono text-base">{count.toString()}</code>
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Playground;
