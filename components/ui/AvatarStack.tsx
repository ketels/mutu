export function AvatarStack({
  initials,
  max = 4,
  size = 30,
}: {
  initials: string[];
  max?: number;
  size?: number;
}) {
  const shown = initials.slice(0, max);
  const rest = initials.length - shown.length;
  const all = rest > 0 ? [...shown, `+${rest}`] : shown;
  return (
    <div className="flex" aria-label={`${initials.length} medlemmar`}>
      {all.map((txt, i) => (
        <span
          key={i}
          className="flex items-center justify-center rounded-full border-2 border-card font-mono text-[11.5px] font-bold text-body"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -8,
            background: txt.startsWith("+")
              ? "#DEDDD4"
              : i % 2 === 0
                ? "#E9E8E2"
                : "#DEDDD4",
            zIndex: all.length - i,
          }}
        >
          {txt}
        </span>
      ))}
    </div>
  );
}
