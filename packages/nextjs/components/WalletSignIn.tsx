"use client";

import { useEffect, useRef } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { type Address, BaseError, Chain, UserRejectedRequestError } from "viem";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useSignMessage } from "wagmi";
import { authClient } from "~~/lib/auth-client";
import { useWalletSignInStore } from "~~/services/store/wallet-sign-in";
import { enabledChains, isEnabledChain } from "~~/services/web3/chains";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const CHAIN_NAMES = enabledChains.map((chain: Chain) => chain.name).join(" or ");

// Declining the wallet prompt is a choice, not a failure, so it gets one plain sentence.
const readableError = (error: unknown) => {
  if (error instanceof BaseError && error.walk(e => e instanceof UserRejectedRequestError)) {
    return "You declined the signature.";
  }
  return getParsedError(error);
};

/**
 * Carries out a wallet sign-in requested through useWalletSignInStore: opens RainbowKit's connect
 * modal if no wallet is connected, then has the wallet sign a SIWE message and hands it to Better
 * Auth. Mounted once in the provider tree so it survives the sign-in dialog closing and the header
 * re-rendering. On success the page navigates to callbackURL, a full load like the OAuth redirect,
 * so lab pages and ProgressSync pick the session up the same way they already do.
 */
export const WalletSignIn = () => {
  const callbackURL = useWalletSignInStore(state => state.callbackURL);
  const finish = useWalletSignInStore(state => state.finish);
  const { address, chainId, isConnected, status } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const signing = useRef(false);
  // connectModalOpen is still false on the render right after openConnectModal(), so a closed modal
  // only means "cancelled" once it has been seen open.
  const sawConnectModal = useRef(false);

  useEffect(() => {
    if (!callbackURL) {
      // Nothing in flight: forget any connect modal seen during the last request, or the next
      // click would read its closed modal as "dismissed" and cancel itself.
      sawConnectModal.current = false;
      return;
    }
    if (signing.current) return;

    if (isConnected && address) {
      sawConnectModal.current = false;
      // The wallet's actual chain, not wagmi's configured one: a smart-contract wallet only
      // verifies on the chain it is deployed on, so an unsupported chain is a switch, not a guess.
      if (chainId === undefined || !isEnabledChain(chainId)) {
        notification.error(`Switch your wallet to ${CHAIN_NAMES} to sign in.`);
        finish();
        return;
      }
      signing.current = true;
      void sign(address, chainId, callbackURL).finally(() => {
        signing.current = false;
      });
      return;
    }

    // wagmi is still restoring a previous connection; it will land as connected or disconnected.
    if (status === "reconnecting" || status === "connecting") return;

    if (connectModalOpen) {
      sawConnectModal.current = true;
      return;
    }
    if (sawConnectModal.current) {
      // Connect modal dismissed without connecting.
      sawConnectModal.current = false;
      finish();
      return;
    }
    openConnectModal?.();

    async function sign(account: Address, signChainId: number, landingURL: string) {
      const toastId = notification.loading("Check your wallet…");
      try {
        const nonce = await authClient.siwe.nonce();
        if (nonce.error || !nonce.data) throw new Error(nonce.error?.message ?? "Could not get a nonce.");

        const message = createSiweMessage({
          domain: window.location.host,
          uri: window.location.origin,
          address: account,
          chainId: signChainId,
          nonce: nonce.data.nonce,
          version: "1",
          statement: "Sign in to Learning Lab",
          expirationTime: new Date(Date.now() + 10 * 60 * 1000),
        });
        const signature = await signMessageAsync({ account, message });

        const verified = await authClient.siwe.verify({ message, signature });
        if (verified.error) throw new Error(verified.error.message ?? "Signature was not accepted.");

        // End the request before navigating: wallets emit chainChanged/accountsChanged right after
        // signing, which re-runs the effect while the page is still unloading.
        finish();
        window.location.assign(landingURL);
      } catch (error) {
        notification.error(readableError(error));
        finish();
      } finally {
        notification.remove(toastId);
      }
    }
  }, [
    callbackURL,
    isConnected,
    address,
    chainId,
    status,
    connectModalOpen,
    openConnectModal,
    signMessageAsync,
    finish,
  ]);

  return null;
};
