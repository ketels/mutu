const VARIANTS = {
  godkant: { label: "Godkänt", fg: "#2F5D50", bg: "#EEF2F0" },
  pagar: { label: "Pågår", fg: "#A66A2C", bg: "#F5EFE6" },
  utlanad: { label: "Utlånad", fg: "#A66A2C", bg: "#F5EFE6" },
  vantar: { label: "Väntar", fg: "#A66A2C", bg: "#F5EFE6" },
  forslag: { label: "Nytt förslag", fg: "#FFFFFF", bg: "#9A4F38" },
  svara: { label: "Svara", fg: "#FFFFFF", bg: "#191918" },
  nekat: { label: "Nekat", fg: "#71716A", bg: "#F0EFEA" },
  forsenad: { label: "Försenad", fg: "#FFFFFF", bg: "#9A4F38" },
} as const;

export type StatusVariant = keyof typeof VARIANTS;

export function StatusPill({
  variant,
  label,
}: {
  variant: StatusVariant;
  label?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[5px] text-[11.5px] font-extrabold uppercase tracking-[0.04em]"
      style={{ color: v.fg, background: v.bg }}
    >
      {label ?? v.label}
    </span>
  );
}
