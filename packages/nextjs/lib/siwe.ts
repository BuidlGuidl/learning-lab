import { Chain, createPublicClient, fallback, isAddress, isHex, verifyMessage } from "viem";
import { mainnet } from "viem/chains";
import { parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { enabledChains, isEnabledChain, rpcTransportsFor } from "~~/services/web3/chains";

export const PRODUCTION_URL = "https://lab.buidlguidl.com";

/**
 * The host a signed SIWE message must name. Better Auth's plugin compares it against a fixed
 * string, not the request's Host header, so it is derived per deployment: production's custom
 * domain, a preview's branch alias (the link Vercel posts on the PR; the per-deployment URL
 * fails the check), or BETTER_AUTH_URL locally. viem only builds messages for dotted hosts,
 * localhost and IP addresses, so a bare dev hostname such as devbox:3000 cannot sign in.
 */
export const siweDomain = () => {
  if (process.env.VERCEL_ENV === "production") return new URL(PRODUCTION_URL).host;
  // ||, not ??: CLI deploys set the Git-derived VERCEL_BRANCH_URL to an empty string.
  const vercelHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (vercelHost) return vercelHost;
  return new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").host;
};

// These clients hold a sign-in request open while they work, so a flaky RPC has to fail fast:
// one attempt per transport, each short, instead of viem's default 10s and three retries.
const RPC_TIMEOUT_MS = 5_000;

// Same chains and RPC order as the browser's wagmi config, so a chain the wallet can sign on is
// one the server can verify on.
const publicClientFor = (chainId: number) => {
  const chain = enabledChains.find((network: Chain) => network.id === chainId);
  if (!chain) return undefined;
  return createPublicClient({
    chain,
    transport: fallback(rpcTransportsFor(chain, { timeout: RPC_TIMEOUT_MS }), { retryCount: 0 }),
  });
};

type VerifyArgs = { message: string; signature: string; address: string; chainId: number };

/**
 * Checks the signature. Most wallets are EOAs, and ecrecover settles those locally; viem's
 * on-chain verifier (ERC-1271 / ERC-6492 smart wallets) always starts with an eth_call, so it
 * only runs when the local check fails. The plugin has already matched nonce and domain, so
 * only the address and validity window are re-checked here. Chains outside enabledChains have no
 * client, so a smart wallet on one is rejected.
 */
export const verifySiweSignature = async ({ message, signature, address, chainId }: VerifyArgs) => {
  if (!isEnabledChain(chainId) || !isAddress(address) || !isHex(signature)) return false;
  if (!validateSiweMessage({ address, message: parseSiweMessage(message) })) return false;
  try {
    // recoverMessageAddress throws on a signature it cannot parse, such as an ERC-6492 wrapper.
    const signedByEoa = await verifyMessage({ address, message, signature }).catch(() => false);
    if (signedByEoa) return true;
    const client = publicClientFor(chainId);
    return !!client && (await client.verifySiweMessage({ message, signature, address }));
  } catch (error) {
    console.error("SIWE signature verification failed:", error);
    return false;
  }
};

// The plugin awaits this before creating the user, so the whole lookup gets one deadline on top
// of the per-transport timeout.
const ENS_TIMEOUT_MS = 5_000;

const withDeadline = <T>(promise: Promise<T>, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
};

/**
 * Names a first-time wallet user after their ENS name when they have one. Only runs once, at
 * account creation, and any lookup failure or timeout falls back to the bare address. The avatar
 * is deliberately left empty: resolving it makes viem fetch whatever URL the ENS record points
 * at, from this server, so UserAvatar's fallback is used instead.
 */
export const lookupEns = async ({ walletAddress }: { walletAddress: string }) => {
  const fallbackResult = { name: walletAddress, avatar: "" };
  if (!isAddress(walletAddress)) return fallbackResult;
  const client = publicClientFor(mainnet.id);
  if (!client) return fallbackResult;

  try {
    const name = await withDeadline(client.getEnsName({ address: walletAddress }), ENS_TIMEOUT_MS);
    return name ? { name, avatar: "" } : fallbackResult;
  } catch (error) {
    console.error("ENS lookup failed:", error);
    return fallbackResult;
  }
};
