import Image from "next/image";
import { BlockieAvatar } from "~~/components/scaffold-eth/BlockieAvatar";
import { userDisplayName, walletAddressOf } from "~~/lib/user-display";

type Props = {
  user: { name: string | null; email: string; image?: string | null };
  size: 24 | 48;
};

const INITIAL_BOX = {
  24: "h-6 w-6 text-xs",
  48: "h-12 w-12 text-lg",
};

/**
 * Provider avatar when there is one, a blockie for an address-named wallet user, otherwise the
 * first letter of their name. Shared by the header and the profile page so the three cases stay
 * in step. No "use client": the profile page renders it on the server and BlockieAvatar is already
 * its own client leaf.
 */
export const UserAvatar = ({ user, size }: Props) => {
  const walletAddress = walletAddressOf(user);

  if (user.image) {
    // unoptimized: provider avatars are remote and next.config declares no images.remotePatterns.
    return <Image src={user.image} alt="" width={size} height={size} className="rounded-full" unoptimized />;
  }
  if (walletAddress) return <BlockieAvatar address={walletAddress} size={size} />;

  const initial = (userDisplayName(user) || "?").charAt(0).toUpperCase();
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-lab-violet font-bold text-pure-white dark:text-dark-bg ${INITIAL_BOX[size]}`}
    >
      {initial}
    </span>
  );
};
