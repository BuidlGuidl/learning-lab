"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SignInMenu } from "~~/components/SignInMenu";

/**
 * Offers a signed-out learner an account once they have progress worth keeping. Lab.tsx owns the
 * "has progress and no session" half; this owns the dismissal. Plain state on purpose: a dismiss
 * lasts until the next page load, then the nudge is back. Nothing is stored.
 */
export const SignInNudge = () => {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Keep ?ch=&card= so the redirect lands back on this card.
  const callbackURL = `${pathname ?? "/"}${typeof window === "undefined" ? "" : window.location.search}`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-lab-border bg-lab-surface px-4 py-3">
      <p className="m-0 min-w-[14rem] flex-1 text-sm text-lab-text">Sign in to keep this progress on any device.</p>
      <div className="flex items-center gap-2">
        <SignInMenu callbackURL={callbackURL} />
        <button
          type="button"
          className="grid h-8 w-8 cursor-pointer place-items-center rounded border border-lab-border bg-lab-surface text-lab-muted transition-colors hover:border-lab-violet hover:text-lab-violet"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
