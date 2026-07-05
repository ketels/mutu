"use client";

import { ShedDot } from "@/components/ui/ShedDot";

export function ItemCard({
  name,
  meta,
  colorIdx,
  photoUrl,
  onClick,
}: {
  name: string;
  meta: string;
  colorIdx: number;
  photoUrl?: string | null;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left transition-transform active:scale-[0.97]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-photo">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="absolute bottom-2 left-2 rounded-[4px] bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted">
            foto: {name.toLowerCase()}
          </span>
        )}
      </div>
      <div className="mt-2.5 text-[15px] font-bold leading-tight tracking-[-0.01em]">
        {name}
      </div>
      {meta && (
        <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          <ShedDot colorIdx={colorIdx} size={6} />
          <span className="truncate">{meta}</span>
        </div>
      )}
    </button>
  );
}
