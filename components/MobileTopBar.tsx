"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

export default function MobileTopBar() {
  return (
    <div className="md:hidden flex items-center justify-between px-5 h-14 border-b border-line bg-surface sticky top-0 z-10">
      <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
        </svg>
        Forge
      </Link>
      <div className="flex items-center gap-2.5">
        <UserMenu compact />
        <ThemeToggle />
      </div>
    </div>
  );
}
