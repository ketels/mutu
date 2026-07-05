"use client";

import { useQuery } from "convex/react";
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
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { fmtDay } from "@/lib/dates";

const IN_COLOR = "#2F5D50"; // du lånar
const OUT_COLOR = "#A66A2C"; // du lånar ut
const WEEKDAYS = ["M", "T", "O", "T", "F", "L", "S"];

export default function KalenderPage() {
  const data = useQuery(api.loans.myLoans);
  if (!data) {
    return (
      <div>
        <MobileHeader title="Kalender" />
      </div>
    );
  }

  const { loans, today } = data;
  const active = loans.filter((l) => l.status === "approved");

  const dotsFor = (day: string) => {
    const dots: string[] = [];
    for (const l of active) {
      if (l.startDay <= day && day <= l.endDay)
        dots.push(l.direction === "in" ? IN_COLOR : OUT_COLOR);
    }
    return dots.slice(0, 3);
  };

  // Kommande händelser: hämtningar och återlämningar
  type Event = { day: string; color: string; title: string; sub: string };
  const events: Event[] = [];
  for (const l of active) {
    const color = l.direction === "in" ? IN_COLOR : OUT_COLOR;
    if (l.startDay >= today) {
      events.push({
        day: l.startDay,
        color,
        title:
          l.direction === "in"
            ? `Hämta ${l.itemName.toLowerCase()} hos ${l.otherName}`
            : `${l.otherName} hämtar ${l.itemName.toLowerCase()}`,
        sub: fmtDay(l.startDay),
      });
    }
    if (l.endDay >= today) {
      events.push({
        day: l.endDay,
        color,
        title:
          l.direction === "in"
            ? `Lämna tillbaka ${l.itemName.toLowerCase()}`
            : `${l.itemName} kommer hem`,
        sub:
          l.direction === "in"
            ? `Till ${l.otherName} · ${fmtDay(l.endDay)}`
            : `${l.otherName} lämnar · ${fmtDay(l.endDay)}`,
      });
    }
  }
  events.sort((a, b) => a.day.localeCompare(b.day));
  const todayEvents = events.filter((e) => e.day === today);
  const upcoming = events.filter((e) => e.day > today);

  const months = [0, 1].map((offset) => {
    const monthStart = startOfMonth(addMonths(parseISO(today), offset));
    return {
      label: format(monthStart, "MMMM yyyy", { locale: sv }),
      days: eachDayOfInterval({
        start: monthStart,
        end: endOfMonth(monthStart),
      }).map((d) => format(d, "yyyy-MM-dd")),
      leadingBlanks: (getDay(monthStart) + 6) % 7,
    };
  });

  return (
    <div>
      <MobileHeader
        title="Kalender"
        right={
          <Link
            href="/lan"
            className="rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-semibold"
          >
            Lista
          </Link>
        }
      />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <div className="hidden items-center justify-between md:flex">
          <h1 className="heading text-[34px]">Kalender</h1>
          <Link
            href="/lan"
            className="rounded-full border border-border bg-card px-4 py-2 text-[13.5px] font-semibold"
          >
            Lista
          </Link>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-10">
          <div>
            {months.map((month) => (
              <div key={month.label} className="mt-5">
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
                    <span key={`b-${i}`} />
                  ))}
                  {month.days.map((day) => {
                    const isToday = day === today;
                    const past = day < today;
                    const dots = dotsFor(day);
                    return (
                      <div
                        key={day}
                        className="flex h-11 flex-col items-center justify-center gap-1 rounded-day"
                        style={{
                          background: isToday ? "#191918" : "transparent",
                        }}
                      >
                        <span
                          className="text-[13px]"
                          style={{
                            color: isToday
                              ? "#FBFBF8"
                              : past
                                ? "#C9C8C0"
                                : "#191918",
                            fontWeight: isToday ? 800 : 400,
                          }}
                        >
                          {Number(day.slice(8))}
                        </span>
                        <span className="flex h-1.5 gap-0.5">
                          {dots.map((c, i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: c }}
                            />
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="label-caps mt-7">Idag</p>
            {todayEvents.length === 0 ? (
              <p className="mt-2 text-[14px] text-muted">
                Inget på schemat idag.
              </p>
            ) : (
              <EventList events={todayEvents} />
            )}

            <p className="label-caps mt-7">Kommande</p>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-[14px] text-muted">
                Inget inbokat. Dags att låna något?
              </p>
            ) : (
              <EventList events={upcoming} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventList({
  events,
}: {
  events: { day: string; color: string; title: string; sub: string }[];
}) {
  return (
    <div className="mt-3 flex flex-col divide-y divide-divider-weak rounded-card border border-border bg-card">
      {events.map((e, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: e.color }}
          />
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-bold">{e.title}</p>
            <p className="truncate text-[12.5px] text-muted">{e.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
