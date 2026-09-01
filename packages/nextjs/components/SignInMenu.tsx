"use client";

import { useState } from "react";
import { SignInModal } from "~~/components/SignInModal";

// The lab's own chrome, not daisyUI's: thin border, small radius, violet on hover. Deliberately not
// `btn` — base.css gives every .btn a 9999rem pill from outside a cascade layer, so no radius utility
// can beat it here (inside .lab, lab.css overrides it to 4px).
export const SUMMARY =
  "flex cursor-pointer list-none items-center justify-center rounded border border-lab-border bg-lab-surface text-sm text-lab-text transition-colors hover:border-lab-violet hover:text-lab-violet [&::-webkit-details-marker]:hidden";
export const MENU =
  "dropdown-content menu menu-sm z-30 mt-2 w-52 gap-1 rounded-lg border border-lab-border bg-lab-surface p-1 text-lab-text shadow-lg";
// daisyUI rounds menu rows to --radius-field (1rem); `rounded` pulls them back to the lab's radius.
export const MENU_ITEM = "rounded text-lab-text hover:bg-lab-inset hover:text-lab-text";

type Props = {
  // Where the OAuth redirect lands. Callers pass the current URL so sign-in returns to the same card.
  callbackURL: string;
  summaryClassName?: string;
};

/**
 * "Sign in" button that opens the provider modal. Shared by the header and the in-lab nudge so both
 * entry points get the same dialog and the two providers are never ranked against each other.
 * The provider buttons follow Google's sign-in branding rules; see SignInModal.
 */
export const SignInMenu = ({ callbackURL, summaryClassName = "" }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`${SUMMARY} h-8 px-3 font-medium ${summaryClassName}`}
        onClick={() => setOpen(true)}
      >
        Sign in
      </button>
      <SignInModal open={open} onClose={() => setOpen(false)} callbackURL={callbackURL} />
    </>
  );
};
