"use client";

import { ShedDot } from "./ShedDot";

export function Chip({
  label,
  active = false,
  colorIdx,
  onClick,
}: {
  label: string;
  active?: boolean;
  colorIdx?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold transition-[opacity,transform] active:opacity-70"
      style={{
        background: active ? "#191918" : "#FFFFFF",
        color: active ? "#FBFBF8" : "#191918",
        borderColor: active ? "#191918" : "#E0DFD8",
      }}
    >
      {colorIdx !== undefined && <ShedDot colorIdx={colorIdx} size={7} />}
      {label}
    </button>
  );
}
