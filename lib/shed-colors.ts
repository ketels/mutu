// Fast dov skjulpalett ur designhandoffen. Nya skjul tilldelas färg via colorIdx (round-robin).
export const SHED_PALETTE = [
  { color: "#2F5D50", light: "#EEF2F0" }, // grön
  { color: "#A66A2C", light: "#F5EFE6" }, // ockra
  { color: "#9A4F38", light: "#FAF1EE" }, // röd-brun
  { color: "#39586B", light: "#EAEEF2" }, // blågrå
  { color: "#66603B", light: "#F1EFE3" }, // oliv
] as const;

export function shedColor(colorIdx: number) {
  return SHED_PALETTE[((colorIdx % SHED_PALETTE.length) + SHED_PALETTE.length) % SHED_PALETTE.length];
}
