import { create } from "zustand";

type WalletSignInState = {
  // Where to land after a successful sign-in; null when no wallet sign-in is in flight.
  callbackURL: string | null;
  start: (callbackURL: string) => void;
  finish: () => void;
};

/**
 * A wallet sign-in outlives the button that started it: the sign-in dialog closes so RainbowKit
 * can take the top layer, and the signed-out header unmounts its menu whenever the session
 * refetches (every tab switch, which a mobile wallet hand-off always causes). So the request
 * lives here and the WalletSignIn component in the provider tree carries it out.
 */
export const useWalletSignInStore = create<WalletSignInState>(set => ({
  callbackURL: null,
  start: callbackURL => set({ callbackURL }),
  finish: () => set({ callbackURL: null }),
}));
