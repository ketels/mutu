"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, NAV_ITEMS } from "./nav-items";

export function BottomNav({ badgeLan = false }: { badgeLan?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-divider bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[58px] flex-col items-center justify-center gap-1 pt-2.5 pb-3"
              style={{ color: active ? "#191918" : "#9B9B92" }}
            >
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                {item.href === "/lan" && badgeLan && (
                  <span
                    aria-label="Ny händelse"
                    className="absolute -right-1 -top-0.5 h-[9px] w-[9px] rounded-full border-2 border-card bg-warn"
                  />
                )}
              </span>
              <span
                className="text-[11.5px]"
                style={{ fontWeight: active ? 700 : 600 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
