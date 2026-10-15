import { Chain, HttpTransportConfig, http } from "viem";
import { mainnet } from "viem/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth/networks";

// Chain and RPC selection shared by the browser wagmi config and server-side viem clients. Kept
// free of connectors so server code (SIWE verification) can import it.

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === mainnet.id)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

export const isEnabledChain = (chainId: number | undefined) =>
  enabledChains.some((network: Chain) => network.id === chainId);

/**
 * RPC transports for a chain, most preferred first, for viem's `fallback`. A scaffold.config
 * override wins; our own Alchemy key comes first, the shared default key last because it
 * rate-limits; mainnet also gets the BuidlGuidl RPC ahead of the chain's public default.
 */
export const rpcTransportsFor = (chain: Chain, config?: HttpTransportConfig) => {
  const mainnetFallbackWithDefaultRPC = [http("https://mainnet.rpc.buidlguidl.com", config)];
  let rpcFallbacks = [...(chain.id === mainnet.id ? mainnetFallbackWithDefaultRPC : []), http(undefined, config)];
  const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];
  if (rpcOverrideUrl) {
    rpcFallbacks = [http(rpcOverrideUrl, config), ...rpcFallbacks];
  } else {
    const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
    if (alchemyHttpUrl) {
      const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
      rpcFallbacks = isUsingDefaultKey
        ? [...rpcFallbacks, http(alchemyHttpUrl, config)]
        : [http(alchemyHttpUrl, config), ...rpcFallbacks];
    }
  }
  return rpcFallbacks;
};
