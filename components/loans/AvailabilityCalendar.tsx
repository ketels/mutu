"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import { sv } from "date-fns/locale";

type Range = { start: string; end: string };

const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

function isBooked(day: string, booked: Range[]) {
  return booked.some((b) => b.start <= day && day <= b.end);
}

/**
 * Tillgänglighetskalender: månadsgrid där upptagna dagar är grå/genomstrukna,
 * valt spann blir ett sammanhängande grönt block. Visar innevarande + nästa månad.
 */
export function AvailabilityCalendar({
  today,
  booked,
  selStart,
  selEnd,
  onPick,
}: {
  today: string;
  booked: Range[];
  selStart: string | null;
  selEnd: string | null;
  onPick: (day: string) => void;
}) {
  const months = [0, 1].map((offset) => {
    const monthStart = startOfMonth(addMonths(parseISO(today), offset));
    return {
      label: format(monthStart, "MMMM yyyy", { locale: sv }),
      days: eachDayOfInterval({
        start: monthStart,
        end: endOfMonth(monthStart),
      }).map((d) => format(d, "yyyy-MM-dd")),
      // getDay: 0=sön → vi vill måndagsstart
      leadingBlanks: (getDay(monthStart) + 6) % 7,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      {months.map((month) => (
        <div key={month.label}>
          <p className="label-caps">{month.label}</p>
          <div className="mt-2 grid grid-cols-7 gap-y-1">
            {WEEKDAYS.map((wd, i) => (
              <span
                key={i}
                className="pb-1 text-center text-[10.5px] font-bold tracking-[0.06em] text-faint"
              >
                {wd}
              </span>
            ))}
            {Array.from({ length: month.leadingBlanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {month.days.map((day) => {
              const booked_ = isBooked(day, booked);
              const past = day < today;
              const inSel =
                selStart !== null &&
                (selEnd !== null
                  ? selStart <= day && day <= selEnd
                  : day === selStart);
              const edgeL = inSel && day === selStart;
              const edgeR = inSel && day === (selEnd ?? selStart);
              const isToday = day === today;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={past}
                  onClick={() => onPick(day)}
                  aria-label={fmtAria(day, booked_, inSel)}
                  className="flex h-10 items-center justify-center text-[13px] transition-transform active:scale-95"
                  style={{
                    background: inSel
                      ? "#2F5D50"
                      : booked_
                        ? "#EDECE5"
                        : "transparent",
                    color: inSel
                      ? "#FBFBF8"
                      : booked_ || past
                        ? "#B4B3AA"
                        : "#191918",
                    fontWeight: inSel || isToday ? 800 : 400,
                    textDecoration: booked_ ? "line-through" : "none",
                    borderRadius:
                      edgeL && edgeR
                        ? "8px"
                        : edgeL
                          ? "8px 0 0 8px"
                          : edgeR
                            ? "0 8px 8px 0"
                            : inSel
                              ? "0"
                              : "8px",
                    outline: isToday && !inSel ? "1.5px solid #191918" : "none",
                    outlineOffset: "-1.5px",
                  }}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-5 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[4px] bg-busy" /> Upptagen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[4px] bg-primary" /> Ditt val
        </span>
      </div>
    </div>
  );
}

function fmtAria(day: string, booked: boolean, selected: boolean) {
  const d = format(parseISO(day), "d MMMM", { locale: sv });
  if (booked) return `${d}, upptagen`;
  if (selected) return `${d}, vald`;
  return d;
}
