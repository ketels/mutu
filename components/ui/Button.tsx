"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "neutral" | "outline" | "danger";

const STYLES: Record<Variant, string> = {
  primary: "bg-primary text-white",
  neutral: "bg-ink text-bg",
  outline: "border border-border bg-card text-ink",
  danger: "border border-warn/30 bg-card text-warn",
};

export function Button({
  variant = "primary",
  full = false,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold transition-[opacity,transform] active:scale-[0.98] active:opacity-80 ${
        disabled ? "bg-disabled text-white" : STYLES[variant]
      } ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
