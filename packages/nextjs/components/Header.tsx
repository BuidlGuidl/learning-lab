"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

/**
 * Minimal site header — product wordmark + theme toggle + wallet. Lab navigation
 * lives in the chapter sidebar; the theme toggle moved up here when the footer went.
 */
export const Header = () => {
  const pathname = usePathname();
  const isLab = pathname?.startsWith("/labs/");

  if (pathname === "/") return null;

  return (
    <div
      className={`sticky top-0 z-20 flex items-center justify-between px-4 py-2 shadow-sm navbar bg-base-100 min-h-0 shrink-0 ${
        isLab ? "lab-header" : ""
      }`}
    >
      <Link href="/" className="flex items-center gap-[9px] text-base font-black tracking-tight">
        <Image src="/eth-diamond-purple.svg" alt="" width={24} height={24} />
        Learning Lab
      </Link>
      <div className="flex items-center gap-3">
        <SwitchTheme className="site-theme-switch" />
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
