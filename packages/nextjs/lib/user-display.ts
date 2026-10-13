import { type Address, isAddress } from "viem";

type DisplayUser = { name: string | null; email: string; image?: string | null };

// Better Auth names a wallet user after their checksummed address unless ENS gives a name, so the
// header and profile need to tell the two apart: an address gets shortened and a blockie.
export const walletAddressOf = (user: DisplayUser): Address | null =>
  user.name && isAddress(user.name) ? user.name : null;

// Hand-rolled rather than <Address format="short">: these users are address-named precisely
// because they have no ENS, so its client-side ENS lookup and skeleton would be wasted.
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

// Full name for the profile, first word for the header; a wallet address is shortened in both.
export const userDisplayName = (user: DisplayUser, { firstWordOnly = false } = {}) => {
  const walletAddress = walletAddressOf(user);
  if (walletAddress) return shortAddress(walletAddress);
  const name = user.name?.trim() ?? "";
  if (firstWordOnly) return name.split(/\s+/)[0] ?? "";
  return name || user.email;
};
