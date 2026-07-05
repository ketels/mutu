"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Bottom-sheet på mobil, centrerad modal på desktop.
 * Scrim rgba(25,25,24,.4), slide-up .3s cubic-bezier(.2,.9,.3,1) enligt handoff.
 */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-[rgba(25,25,24,0.4)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 max-h-[92dvh] w-full animate-sheet-up overflow-y-auto rounded-t-[24px] bg-bg pb-[env(safe-area-inset-bottom)] shadow-sheet md:max-h-[85dvh] md:max-w-[440px] md:animate-fade-in md:rounded-[24px]"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-bg pb-1 pt-2.5 md:hidden">
          <div className="h-1 w-9 rounded-full bg-dash" aria-hidden />
        </div>
        {children}
      </div>
    </div>
  );
}
