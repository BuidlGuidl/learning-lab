"use client";

// Reads PRICE and stock off the deployed machine. The reads run against the
// live world, so they also land in the console log.
import { useState } from "react";
import { formatEther } from "viem";
import type { World } from "~~/lib/lab/harness";

type Props = { world: World };

export const ReadTheMachine = ({ world }: Props) => {
  const machine = world.contracts.VendingMachine;
  const [price, setPrice] = useState<bigint | null>(null);
  const [stock, setStock] = useState<bigint | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const readValue = async (tag: "price" | "stock") => {
    setBusy(tag);
    try {
      if (tag === "price") setPrice((await world.read(machine, "PRICE")) as bigint);
      else setStock((await world.read(machine, "stock")) as bigint);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-box px-5 py-4 flex flex-col gap-3 items-start">
      <p className="text-sm text-base-content/80 m-0">
        It&apos;s a real contract now, with public state. Ask it for the <code className="font-mono">PRICE</code> and{" "}
        <code className="font-mono">stock</code> you set. The answers come straight from the chain, not from the source
        file, and reading them is free: no transaction, no gas.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm gap-2" onClick={() => readValue("price")} disabled={busy !== null}>
          {busy === "price" && <span className="loading loading-spinner loading-xs" />}
          Read PRICE
        </button>
        <button className="btn btn-primary btn-sm gap-2" onClick={() => readValue("stock")} disabled={busy !== null}>
          {busy === "stock" && <span className="loading loading-spinner loading-xs" />}
          Read stock
        </button>
      </div>
      {price !== null && (
        <p className="font-mono text-sm m-0">
          <span className="text-base-content/60">PRICE</span> ={" "}
          <span className="text-lab-mint tabular-nums">{formatEther(price)} ETH</span>
        </p>
      )}
      {stock !== null && (
        <p className="font-mono text-sm m-0">
          <span className="text-base-content/60">stock</span> ={" "}
          <span className="text-lab-mint tabular-nums">{stock.toString()} snacks</span>
        </p>
      )}
    </div>
  );
};
