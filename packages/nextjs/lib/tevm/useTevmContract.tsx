"use client";

// In-memory EVM that lives for the component and dies on reload. State-changing calls
// go through tevmContract because viem.writeContract trips on tevm's memory state
// across the deploy/call boundary.
import { useCallback, useMemo, useRef, useState } from "react";
import { PREFUNDED_ACCOUNTS, createMemoryClient } from "tevm";
import type { Abi } from "viem";
import { TxnNotification } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

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

// TODO: rework feedback surface when deck cards land. for now we mirror SE-2's useScaffoldWriteContract pattern (toast loading → toast result) inside the hook; cards may want per-card notifications or none.
//
// handles the memory client + deployment state for the component. returns live state (status, address, error) plus deploy/call/read so callers drive the full flow without touching tevm directly. toasts on completion via SE-2 notification helper.
export function useTevmContract() {
  const client = useMemo(() => createMemoryClient({ miningConfig: { type: "auto" } }), []);
  const deployer = useMemo(() => PREFUNDED_ACCOUNTS[0], []);

  const [status, setStatus] = useState<Status>("idle");
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  // refs so callbacks read the current deployment without stale closures
  const abiRef = useRef<Abi | null>(null);
  const addressRef = useRef<`0x${string}` | null>(null);

  // deploys the contract: abi + bytecode in, address out. stashes both into refs so later call/read can find them.
  const deploy = useCallback(
    async (abi: Abi, bytecode: `0x${string}`, args: readonly unknown[] = []) => {
      setStatus("deploying");
      setError(null);
      const loadingId = notification.loading(<TxnNotification message="Deploying contract." />);
      try {
        const hash = await client.deployContract({
          abi,
          bytecode: bytecode as unknown as `0x${string}`,
          args,
          account: deployer,
          chain: null, // the memory client has no viem chain identity, so null skips the check
        });
        const receipt = await client.waitForTransactionReceipt({ hash });
        const addr = receipt.contractAddress as `0x${string}` | null;
        if (!addr) throw new Error("deployment receipt has no contract address");
        abiRef.current = abi;
        addressRef.current = addr;
        setAddress(addr);
        setStatus("ready");
        notification.remove(loadingId);
        notification.success(<TxnNotification message={`Contract deployed at ${shortAddr(addr)}`} />);
        return addr;
      } catch (e) {
        const msg = shortMsg((e as Error).message);
        setError(msg);
        setStatus("error");
        notification.remove(loadingId);
        notification.error(msg);
        throw e;
      }
    },
    [client, deployer],
  );

  // a state-changing call, routed through tevmContract. throws on revert and lets the caller handle it.
  const writeContract = useCallback(
    async (functionName: string, args: readonly unknown[] = []) => {
      const abi = abiRef.current;
      const addr = addressRef.current;
      if (!abi || !addr) throw new Error("call() before deploy()");
      setStatus("calling");
      setError(null);
      const loadingId = notification.loading(<TxnNotification message="Waiting for transaction to complete." />);
      try {
        // using the legacy overload: the typed { contract, method } shape wants a typed contract object, and we only have raw abi here.
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
        notification.remove(loadingId);
        notification.success(<TxnNotification message="Transaction completed successfully!" />);
      } catch (e) {
        const msg = shortMsg((e as Error).message);
        setError(msg);
        setStatus("error");
        notification.remove(loadingId);
        notification.error(msg);
        throw e;
      }
    },
    [client, deployer.address],
  );

  const readContract = useCallback(
    async (functionName: string, args: readonly unknown[] = []) => {
      const abi = abiRef.current;
      const addr = addressRef.current;
      if (!abi || !addr) throw new Error("read() before deploy()");
      try {
        return await client.readContract({ address: addr, abi, functionName, args });
      } catch (e) {
        notification.error(shortMsg((e as Error).message));
        throw e;
      }
    },
    [client],
  );

  return { status, address, error, deploy, writeContract, readContract };
}

function shortAddr(addr: `0x${string}`): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function shortMsg(msg: string): string {
  return msg.split("\n")[0].slice(0, 160);
}
