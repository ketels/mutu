"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { isActive, NAV_ITEMS } from "./nav-items";

export function TopNav() {
  const pathname = usePathname();
  const badgeLan = useQuery(api.messages.hasUnread) ?? false;
  return (
    <header className="sticky top-0 z-30 hidden border-b border-divider bg-card md:block">
      <div className="mx-auto flex h-[70px] max-w-6xl items-center gap-9 px-12">
        <Link href="/" className="heading text-[22px] lowercase">
          mutu
        </Link>
        <nav className="flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative pb-0.5 text-[14.5px]"
                style={{
                  fontWeight: active ? 700 : 600,
                  color: active ? "#191918" : "#71716A",
                  boxShadow: active ? "inset 0 -2px 0 #191918" : "none",
                }}
              >
                {item.label}
                {item.href === "/lan" && badgeLan && (
                  <span className="absolute -right-2.5 top-0 h-[8px] w-[8px] rounded-full bg-warn" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <ProfileButton />
        </div>
      </div>
    </header>
  );
}

export function ProfileButton() {
  const viewer = useQuery(api.users.viewer);
  const initial = viewer?.name?.[0]?.toUpperCase() ?? "·";
  return (
    <Link
      href="/profil"
      aria-label="Profil"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[13.5px] font-bold text-bg"
    >
      {initial}
    </Link>
  );
}
