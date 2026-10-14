import { enabledChains, rpcTransportsFor } from "./chains";
import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, fallback } from "viem";
import { hardhat } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors(),
  ssr: true,
  client: ({ chain }) =>
    createClient({
      chain,
      transport: fallback(rpcTransportsFor(chain)),
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    }),
});
