"use client";

import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const base =
  "w-full rounded-field border border-border bg-card px-[15px] py-[13px] text-[14.5px] text-ink placeholder:text-faint outline-none focus:border-ink";

export function Input({
  label,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="label-caps mb-2 block">{label}</span>}
      <input className={`${base} ${className}`} {...rest} />
    </label>
  );
}

export function Textarea({
  label,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="label-caps mb-2 block">{label}</span>}
      <textarea className={`${base} min-h-24 resize-none ${className}`} {...rest} />
    </label>
  );
}
