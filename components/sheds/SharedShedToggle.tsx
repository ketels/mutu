"use client";

import { Users, type LucideIcon } from "lucide-react";

/**
 * Tillvalet "Delat skjul": alla medlemmar kan dela in saker och bjuda in.
 * Av = normalläget (bara ägaren lägger in) — det kommuniceras inte med ord.
 */
export function SharedShedToggle({
  on,
  onToggle,
  icon: Icon = Users,
}: {
  on: boolean;
  onToggle: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 rounded-field border-[1.5px] p-3.5 text-left transition-colors"
      style={{
        background: on ? "#EEF2F0" : "#FFFFFF",
        borderColor: on ? "#2F5D50" : "#E0DFD8",
      }}
    >
      <span>
        <span className="flex items-center gap-2 text-[14.5px] font-bold">
          <Icon size={15} strokeWidth={2.2} />
          Delat skjul
        </span>
        <span className="mt-1 block text-[12.5px] leading-snug text-muted">
          Alla medlemmar kan dela in sina saker och bjuda in fler — som en
          gemensam bod för grannar, familjen eller föreningen.
        </span>
      </span>
      <span
        aria-hidden
        className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors"
        style={{ background: on ? "#2F5D50" : "#D8D7CF" }}
      >
        <span
          className="absolute top-[3px] h-5 w-5 rounded-full bg-white transition-[left]"
          style={{ left: on ? 21 : 3 }}
        />
      </span>
    </button>
  );
}
