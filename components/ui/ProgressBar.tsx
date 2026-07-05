export function ProgressBar({
  percent,
  color,
  left,
  right,
}: {
  percent: number;
  color: string;
  left?: string;
  right?: string;
}) {
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-[3px] bg-divider-weak">
        <div
          className="h-full rounded-[3px]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color }}
        />
      </div>
      {(left || right) && (
        <div className="mt-1.5 flex justify-between text-xs text-muted">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  );
}
