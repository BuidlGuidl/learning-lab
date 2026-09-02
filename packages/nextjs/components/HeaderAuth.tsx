"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { signIn, signOut, useSession } from "~~/lib/auth-client";

// Pending and signed-out share this box, so the header holds its shape while the session resolves.
const CONTROL_FRAME = "h-8 min-w-[6.5rem]";
const MENU = "dropdown-content menu menu-sm z-30 mt-2 w-52 gap-1 rounded-box bg-base-200 p-2 shadow-lg";

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

  const handleSocialSignIn = (provider: "google" | "github") => {
    closeDropdown();
    void signIn.social({ provider, callbackURL: pathname ?? "/" });
  };

  const handleSignOut = async () => {
    closeDropdown();
    await signOut();
    router.refresh();
  };

  // Hold the space silently rather than flash a signed-out button at a signed-in user.
  if (isPending) return <div className={CONTROL_FRAME} aria-hidden />;

  const user = session?.user;

  if (!user) {
    return (
      <details ref={dropdownRef} className="dropdown dropdown-end">
        <summary className={`btn btn-sm btn-primary ${CONTROL_FRAME} gap-1`}>
          Sign in
          <ChevronDownIcon className="h-4 w-4" />
        </summary>
        <ul className={MENU}>
          <li>
            <button type="button" onClick={() => handleSocialSignIn("google")}>
              Continue with Google
            </button>
          </li>
          <li>
            <button type="button" onClick={() => handleSocialSignIn("github")}>
              Continue with GitHub
            </button>
          </li>
        </ul>
      </details>
    );
  }

  const firstName = user.name?.trim().split(/\s+/)[0] ?? "";
  const initial = (firstName || user.email || "?").charAt(0).toUpperCase();

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end">
      <summary className={`btn btn-sm btn-ghost ${CONTROL_FRAME} gap-2 px-2 font-normal`}>
        {user.image ? (
          // unoptimized: provider avatars are remote and next.config declares no images.remotePatterns.
          <Image src={user.image} alt="" width={24} height={24} className="rounded-full" unoptimized />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
            {initial}
          </span>
        )}
        {firstName ? <span className="max-w-24 truncate">{firstName}</span> : null}
        <ChevronDownIcon className="h-4 w-4 opacity-60" />
      </summary>
      <ul className={MENU}>
        <li>
          <button type="button" className="text-error" onClick={handleSignOut}>
            Sign out
          </button>
        </li>
      </ul>
    </details>
  );
};
