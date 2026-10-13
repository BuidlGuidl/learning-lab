"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { MENU, MENU_ITEM, SUMMARY, SignInMenu } from "~~/components/SignInMenu";
import { UserAvatar } from "~~/components/UserAvatar";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { signOut, useSession } from "~~/lib/auth-client";
import { userDisplayName } from "~~/lib/user-display";
import { clearLocalProgress } from "~~/services/store/lab-persistence";
import { notification } from "~~/utils/scaffold-eth";

// Pending and signed-out share this box, so the header holds its shape while the session resolves.
const CONTROL_FRAME = "h-8 min-w-[6.5rem]";
/**
 * Session control for the site header: a sign-in menu when signed out, the user's avatar and
 * first name when signed in. Both sit in a daisyUI details dropdown, same as AddressInfoDropdown.
 */
export const HeaderAuth = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const closeDropdown = useCallback(() => dropdownRef.current?.removeAttribute("open"), []);
  useOutsideClick(dropdownRef, closeDropdown);

  const handleSignOut = async () => {
    closeDropdown();
    const { error } = await signOut();
    if (error) {
      notification.error(error.message ?? "Sign-out failed, please try again.");
      return; // still signed in: keep the local state and don't refresh
    }
    // The next person on this browser must not inherit (and the sweep must not upload)
    // this user's local answers. Their real progress is already on the server.
    clearLocalProgress();
    router.refresh();
  };

  // Hold the space silently rather than flash a signed-out button at a signed-in user.
  if (isPending) return <div className={CONTROL_FRAME} aria-hidden />;

  const user = session?.user;

  if (!user) return <SignInMenu callbackURL={pathname ?? "/"} summaryClassName={CONTROL_FRAME} />;

  const label = userDisplayName(user, { firstWordOnly: true });

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end">
      <summary className={`${SUMMARY} ${CONTROL_FRAME} gap-2 px-2`}>
        <UserAvatar user={user} size={24} />
        {label ? <span className="max-w-24 truncate">{label}</span> : null}
        <ChevronDownIcon className="h-4 w-4 opacity-60" />
      </summary>
      <ul className={MENU}>
        <li>
          <Link href="/profile" className={MENU_ITEM} onClick={closeDropdown}>
            Profile
          </Link>
        </li>
        <li>
          <button
            type="button"
            className="rounded text-lab-error hover:bg-lab-inset hover:text-lab-error"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </li>
      </ul>
    </details>
  );
};
