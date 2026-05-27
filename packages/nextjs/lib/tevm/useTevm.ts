"use client";

// Owns an in-memory EVM (tevm) for the lifetime of the component that uses it.
// The chain is not persisted — reload resets it. State-changing calls go through
// tevmContract with addToBlockchain:true; viem.writeContract mis-handles tevm
// memory state across the deploy → call boundary.
import { useCallback, useMemo, useRef, useState } from "react";
import { PREFUNDED_ACCOUNTS, createMemoryClient } from "tevm";
import type { Abi } from "viem";

export type LogKind = "info" | "ok" | "err";
export type LogEntry = { ts: number; kind: LogKind; text: string };
export type Status = "idle" | "deploying" | "calling" | "ready" | "error";

type TevmContractParams = {
  to: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  from: `0x${string}`;
  value?: bigint;
  addToBlockchain: true;
};
type TevmContractFn = (p: TevmContractParams) => Promise<{ errors?: Array<{ message?: string }> }>;

export function useTevm() {
  const client = useMemo(() => createMemoryClient({ miningConfig: { type: "auto" } }), []);
  const deployer = useMemo(() => PREFUNDED_ACCOUNTS[0], []);

  const [status, setStatus] = useState<Status>("idle");
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // refs so callbacks read the current deployment without stale closures
  const abiRef = useRef<Abi | null>(null);
  const addressRef = useRef<`0x${string}` | null>(null);

  const appendLog = useCallback((kind: LogKind, text: string) => {
    setLogs(prev => [...prev, { ts: Date.now(), kind, text }]);
  }, []);

  const deploy = useCallback(
    async (abi: Abi, bytecode: `0x${string}`, args: readonly unknown[] = []) => {
      setStatus("deploying");
      setError(null);
      appendLog("info", "deploying contract…");
      try {
        const hash = await client.deployContract({
          abi,
          bytecode: bytecode as unknown as `0x${string}`,
          args,
          account: deployer,
          chain: null,
        });
        appendLog("info", `tx ${hash}`);
        const receipt = await client.waitForTransactionReceipt({ hash });
        const addr = receipt.contractAddress as `0x${string}` | null;
        if (!addr) throw new Error("deployment receipt has no contract address");
        abiRef.current = abi;
        addressRef.current = addr;
        setAddress(addr);
        setStatus("ready");
        appendLog("ok", `deployed at ${addr} (gas ${receipt.gasUsed})`);
        return addr;
      } catch (e) {
        const msg = (e as Error).message;
        setError(msg);
        setStatus("error");
        appendLog("err", `deploy failed: ${shortMsg(msg)}`);
        throw e;
      }
    },
    [client, deployer, appendLog],
  );

  const call = useCallback(
    async (functionName: string, args: readonly unknown[] = []) => {
      const abi = abiRef.current;
      const addr = addressRef.current;
      if (!abi || !addr) throw new Error("call() before deploy()");
      setStatus("calling");
      setError(null);
      appendLog("info", `${functionName}(${args.map(fmtArg).join(", ")})…`);
      try {
        const tevmContract = client.tevmContract as unknown as TevmContractFn;
        const r = await tevmContract({
          to: addr,
          abi,
          functionName,
          args,
          from: deployer.address as `0x${string}`,
          addToBlockchain: true,
        });
        if (r.errors && r.errors.length > 0) {
          throw new Error(r.errors[0]?.message ?? "transaction reverted");
        }
        setStatus("ready");
        appendLog("ok", `${functionName} ok`);
      } catch (e) {
        const msg = (e as Error).message;
        setError(msg);
        setStatus("error");
        appendLog("err", `${functionName} failed: ${shortMsg(msg)}`);
        throw e;
      }
    },
    [client, deployer.address, appendLog],
  );

  const read = useCallback(
    async (functionName: string, args: readonly unknown[] = []) => {
      const abi = abiRef.current;
      const addr = addressRef.current;
      if (!abi || !addr) throw new Error("read() before deploy()");
      appendLog("info", `read ${functionName}(${args.map(fmtArg).join(", ")})…`);
      try {
        const result = await client.readContract({ address: addr, abi, functionName, args });
        appendLog("ok", `${functionName} = ${fmtArg(result)}`);
        return result;
      } catch (e) {
        const msg = (e as Error).message;
        appendLog("err", `read ${functionName} failed: ${shortMsg(msg)}`);
        throw e;
      }
    },
    [client, appendLog],
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  return { status, address, error, logs, deploy, call, read, clearLogs, log: appendLog };
}

function fmtArg(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (v === null || v === undefined) return String(v);
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function shortMsg(msg: string): string {
  return msg.split("\n")[0].slice(0, 160);
}
