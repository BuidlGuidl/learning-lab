"use client";

import { useState } from "react";
import { CardFrame } from "../CardFrame";
import { formatEther } from "viem";
import { registry } from "~~/labs/registry";
import { assembleSources } from "~~/lib/lab/assemble";
import { bootWorld } from "~~/lib/lab/harness";
import type { ContractHandle } from "~~/lib/lab/harness";
import type { DeploymentCard as DeploymentCardType } from "~~/lib/lab/types";
import { compileSolidity } from "~~/lib/solc/solc";
import type { CompilerPhase } from "~~/lib/solc/solc";
import { fillsOf, useLabStore } from "~~/services/store/lab-store";

type Props = {
  card: DeploymentCardType;
};

type DeployState =
  | { status: "idle" }
  | { status: "compiling"; phase: CompilerPhase }
  | { status: "deploying" }
  | { status: "success"; contracts: Record<string, ContractHandle>; readbackValues: ReadbackValue[] }
  | { status: "error"; message: string };

type ReadbackValue = { label: string; value: unknown; format?: "eth" };

const truncateTxHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;

const formatGas = (gas: bigint) => gas.toLocaleString();

const renderValue = (value: unknown, format?: "eth"): string => {
  if (format === "eth" && typeof value === "bigint") return `${formatEther(value)} ETH`;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return value;
  return String(value);
};

export const DeploymentCard = ({ card }: Props) => {
  const files = useLabStore(s => s.files);
  const regions = useLabStore(s => s.regions);
  const progress = useLabStore(s => s.progress);
  const currentLabId = useLabStore(s => s.currentLabId);

  const [state, setState] = useState<DeployState>({ status: "idle" });
  const [compileErrors, setCompileErrors] = useState<string[]>([]);

  const handleDeploy = async () => {
    setCompileErrors([]);
    setState({ status: "compiling", phase: "downloading" });

    try {
      // assemble all sources with the learner's fills backfilled canonically
      const sources = assembleSources(files, regions, fillsOf(progress));

      // compile each file, merging contracts from all results
      const compiled: Record<string, { abi: unknown[]; bytecode: `0x${string}` }> = {};
      const errors: string[] = [];

      for (const [filename, source] of Object.entries(sources)) {
        const result = await compileSolidity(source, phase => {
          setState({ status: "compiling", phase });
        });
        if (!result.ok) {
          errors.push(`[${filename}]\n${result.errors.join("\n")}`);
        } else {
          for (const [name, contract] of Object.entries(result.contracts)) {
            compiled[name] = { abi: contract.abi, bytecode: contract.bytecode };
          }
        }
      }

      if (errors.length > 0) {
        setCompileErrors(errors);
        setState({ status: "idle" });
        return;
      }

      setState({ status: "deploying" });

      if (!currentLabId || !registry[currentLabId]) {
        throw new Error(`no registry entry for lab "${currentLabId}"`);
      }

      const { deploy } = await registry[currentLabId].loadDeploy();
      const world = await bootWorld(compiled, deploy);

      // run readbacks
      const readbackValues: ReadbackValue[] = [];
      if (card.readbacks) {
        for (const rb of card.readbacks) {
          const handle = world.contracts[rb.contract];
          if (!handle) continue;
          const value = await world.read(handle, rb.fn, rb.args ?? []);
          readbackValues.push({ label: rb.label, value, format: rb.format });
        }
      }

      setState({ status: "success", contracts: world.contracts, readbackValues });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", message });
    }
  };

  const isSuccess = state.status === "success";
  const isError = state.status === "error";
  const isBusy = state.status === "compiling" || state.status === "deploying";

  const buttonLabel = (() => {
    if (state.status === "compiling") {
      return state.phase === "downloading" ? "Fetching compiler…" : "Compiling…";
    }
    if (state.status === "deploying") return "Deploying…";
    if (isSuccess) return "Deploy again";
    return "Deploy";
  })();

  return (
    <CardFrame card={card}>
      <p className="text-base-content/90 leading-relaxed whitespace-pre-wrap mb-4">{card.body}</p>

      {compileErrors.length > 0 && (
        <div className="alert alert-error mb-4">
          <pre className="font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {compileErrors.join("\n\n")}
          </pre>
        </div>
      )}

      {isError && (
        <div className="alert alert-error mb-4">
          <span>{state.message}</span>
        </div>
      )}

      {isSuccess && (
        <div className="rounded-box border border-base-300 bg-base-200/40 p-4 mb-4 space-y-3">
          {Object.entries(state.contracts).map(([name, handle]) => (
            <div key={name} className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base-content">{name}</span>
                <span className="badge badge-success badge-sm">live</span>
              </div>
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-xs text-base-content/50 uppercase tracking-wider mt-0.5">address</span>
                <span className="font-mono text-sm break-all text-base-content/80">{handle.address}</span>
              </div>
              {handle.deployment?.gasUsed !== undefined && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-base-content/50 uppercase tracking-wider">gas used</span>
                  <span className="font-mono text-sm text-base-content/80">{formatGas(handle.deployment.gasUsed)}</span>
                </div>
              )}
              {handle.deployment?.txHash && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-base-content/50 uppercase tracking-wider">tx</span>
                  <span className="font-mono text-sm text-base-content/60">
                    {truncateTxHash(handle.deployment.txHash)}
                  </span>
                </div>
              )}
            </div>
          ))}

          {state.readbackValues.length > 0 && (
            <div className="pt-2 border-t border-base-300 space-y-1">
              {state.readbackValues.map((rb, i) => (
                <div key={i} className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-base-content/50 uppercase tracking-wider">{rb.label}</span>
                  <span
                    className={`text-sm text-base-content/80 ${typeof rb.value === "string" && rb.value.startsWith("0x") ? "font-mono" : ""}`}
                  >
                    {renderValue(rb.value, rb.format)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-actions justify-end">
        <button className="btn btn-primary" onClick={handleDeploy} disabled={isBusy}>
          {buttonLabel}
        </button>
      </div>
    </CardFrame>
  );
};
