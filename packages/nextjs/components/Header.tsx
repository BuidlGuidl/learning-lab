"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SwitchTheme } from "~~/components/SwitchTheme";

/**
 * Minimal site header — product wordmark + theme toggle. The lab runs entirely in-browser
 * (tevm), so there's no wallet to connect; chapter navigation lives in the sidebar.
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
      <SwitchTheme className="site-theme-switch" />
    </div>
  );
};
