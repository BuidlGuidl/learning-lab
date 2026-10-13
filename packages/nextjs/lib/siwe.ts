import { Chain, createPublicClient, fallback, isAddress, isHex } from "viem";
import { mainnet } from "viem/chains";
import { enabledChains, rpcTransportsFor } from "~~/services/web3/chains";

export const PRODUCTION_URL = "https://lab.buidlguidl.com";

/**
 * The host a signed SIWE message must name. Better Auth's plugin compares it against a fixed
 * string, not the request's Host header, so it is derived per deployment: production's custom
 * domain, a preview's own deployment URL, or BETTER_AUTH_URL locally. A preview opened through
 * a branch alias instead of its deployment URL fails this check; open the deployment URL instead.
 */
export const siweDomain = () => {
  if (process.env.VERCEL_ENV === "production") return new URL(PRODUCTION_URL).host;
  if (process.env.VERCEL_URL) return process.env.VERCEL_URL;
  return new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").host;
};

// Same chains and RPC order as the browser's wagmi config, so a chain the wallet can sign on is
// one the server can verify on.
const publicClientFor = (chainId: number, { timeout }: { timeout?: number } = {}) => {
  const chain = enabledChains.find((network: Chain) => network.id === chainId);
  if (!chain) return undefined;
  return createPublicClient({ chain, transport: fallback(rpcTransportsFor(chain, { timeout })) });
};

type VerifyArgs = { message: string; signature: string; address: string; chainId: number };

/**
 * Checks the signature on-chain-aware: viem's verifySiweMessage handles plain EOA signatures and
 * ERC-1271 / ERC-6492 smart-wallet ones, which need a client on the chain the wallet lives on.
 * Chains outside enabledChains have no client here, so a message naming one is rejected.
 */
export const verifySiweSignature = async ({ message, signature, address, chainId }: VerifyArgs) => {
  const client = publicClientFor(chainId);
  if (!client || !isAddress(address) || !isHex(signature)) return false;
  try {
    return await client.verifySiweMessage({ message, signature, address });
  } catch (error) {
    console.error("SIWE signature verification failed:", error);
    return false;
  }
};

// The plugin awaits this before creating the user, so a slow RPC would hold the sign-in: keep
// each call short and fall back to the bare address rather than wait out viem's default 10s.
const ENS_TIMEOUT_MS = 3_000;

/**
 * Names a first-time wallet user after their ENS record when they have one. Only runs once, at
 * account creation, and any lookup failure falls back to the bare address.
 */
export const lookupEns = async ({ walletAddress }: { walletAddress: string }) => {
  const fallbackResult = { name: walletAddress, avatar: "" };
  if (!isAddress(walletAddress)) return fallbackResult;
  try {
    const client = publicClientFor(mainnet.id, { timeout: ENS_TIMEOUT_MS });
    const name = await client?.getEnsName({ address: walletAddress });
    if (!name) return fallbackResult;
    const avatar = await client?.getEnsAvatar({ name });
    return { name, avatar: avatar ?? "" };
  } catch (error) {
    console.error("ENS lookup failed:", error);
    return fallbackResult;
  }
};
