"use client";

import { useCallback, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { signIn } from "~~/lib/auth-client";

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
 * "Sign in" dropdown with Google and GitHub as equal items. Shared by the header and the in-lab
 * nudge so the two providers are never ranked against each other.
 * TODO: Google's sign-in branding rules want their logo/button shape; handle when the button is final.
 */
export const SignInMenu = ({ callbackURL, summaryClassName = "" }: Props) => {
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = useCallback(() => dropdownRef.current?.removeAttribute("open"), []);
  useOutsideClick(dropdownRef, closeDropdown);

  const handleSocialSignIn = (provider: "google" | "github") => {
    closeDropdown();
    void signIn.social({ provider, callbackURL });
  };

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end">
      <summary className={`${SUMMARY} h-8 gap-1 px-3 font-medium ${summaryClassName}`}>
        Sign in
        <ChevronDownIcon className="h-4 w-4" />
      </summary>
      <ul className={MENU}>
        <li>
          <button type="button" className={MENU_ITEM} onClick={() => handleSocialSignIn("google")}>
            Continue with Google
          </button>
        </li>
        <li>
          <button type="button" className={MENU_ITEM} onClick={() => handleSocialSignIn("github")}>
            Continue with GitHub
          </button>
        </li>
      </ul>
    </details>
  );
};
