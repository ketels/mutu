import { shedColor } from "@/lib/shed-colors";

export function ShedDot({
  colorIdx,
  size = 8,
}: {
  colorIdx: number;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: shedColor(colorIdx).color }}
    />
  );
}
