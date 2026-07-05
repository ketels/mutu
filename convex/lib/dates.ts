// Lån lagras som hela dagar i ISO-format "YYYY-MM-DD".
// Strängjämförelser är säkra eftersom formatet är lexikografiskt sorterbart.

/** Dagens datum i svensk tid (Convex kör UTC). */
export function todayISO(now = Date.now()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
  }).format(new Date(now)); // sv-SE ger "YYYY-MM-DD"
}

export function isValidISODate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Överlappar [aStart, aEnd] med [bStart, bEnd]? (inklusiva heldagar) */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Antal dagar i perioden, inklusivt (mån–ons = 3). */
export function daysInRange(start: string, end: string) {
  const ms =
    Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z");
  return Math.round(ms / 86_400_000) + 1;
}

export function addDays(day: string, n: number) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
