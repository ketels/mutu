import { format, parseISO, differenceInCalendarDays, addDays as dfAddDays } from "date-fns";
import { sv } from "date-fns/locale";

/** "2026-07-08" → "ons 8 juli" */
export function fmtDay(day: string) {
  return format(parseISO(day), "EEE d MMMM", { locale: sv }).replace(".", "");
}

/** "ons 8 → fre 10 juli" (månad bara i slutet om samma månad) */
export function fmtRange(start: string, end: string) {
  if (start === end) return fmtDay(start);
  const s = parseISO(start);
  const e = parseISO(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const startStr = sameMonth
    ? format(s, "EEE d", { locale: sv }).replace(".", "")
    : fmtDay(start);
  return `${startStr} → ${fmtDay(end)}`;
}

/** Kort veckodag: "t.o.m. sön" */
export function fmtWeekday(day: string) {
  return format(parseISO(day), "EEE", { locale: sv }).replace(".", "");
}

/** Antal dagar i perioden, inklusivt. */
export function daysInRange(start: string, end: string) {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
}

/** "Dag X av Y" för progressbaren. Klampas till periodens gränser. */
export function loanProgress(start: string, end: string, today: string) {
  const total = daysInRange(start, end);
  const day = Math.min(
    total,
    Math.max(1, daysInRange(start, today)),
  );
  return { day, total, percent: (day / total) * 100 };
}

export function todayISOClient() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
  }).format(new Date());
}

export function addDaysISO(day: string, n: number) {
  return format(dfAddDays(parseISO(day), n), "yyyy-MM-dd");
}
