// Svensk datumformattering för Convex-sidan (utan date-fns-beroende).

const WEEKDAYS = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"];
const MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

/** "2026-07-08" → "ons 8 juli" */
export function fmtDaySv(day: string) {
  const d = new Date(day + "T00:00:00Z");
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "ons 8 → fre 10 juli" */
export function fmtRangeSv(start: string, end: string) {
  if (start === end) return fmtDaySv(start);
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const sameMonth = s.getUTCMonth() === e.getUTCMonth();
  const startStr = sameMonth
    ? `${WEEKDAYS[s.getUTCDay()]} ${s.getUTCDate()}`
    : fmtDaySv(start);
  return `${startStr} → ${fmtDaySv(end)}`;
}
