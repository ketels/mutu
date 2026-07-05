"use client";

import { useMutation, useQuery } from "convex/react";
import { Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { LoanCard, type LoanRow } from "@/components/loans/LoanCard";
import { useToast } from "@/components/ui/Toast";
import { fmtWeekday } from "@/lib/dates";

export default function LanPage() {
  const data = useQuery(api.loans.myLoans);
  const markReturned = useMutation(api.loans.markReturned);
  const toast = useToast();

  if (!data) {
    return (
      <div>
        <MobileHeader title="Lån" />
      </div>
    );
  }

  const { loans, today } = data;
  const visible = loans.filter(
    (l) => l.status !== "declined" && l.status !== "cancelled",
  );
  const lending = visible.filter(
    (l) => l.direction === "out" && l.status !== "returned",
  );
  const borrowing = visible.filter(
    (l) => l.direction === "in" && l.status !== "returned",
  );
  const history = visible.filter((l) => l.status === "returned");

  // Åtgärdsbanner: lån jag har hemma som ska lämnas idag (eller är försenat)
  const dueToday = loans.filter(
    (l) =>
      l.direction === "in" &&
      l.status === "approved" &&
      l.endDay <= today &&
      l.startDay <= today,
  );

  return (
    <div>
      <MobileHeader
        title="Lån"
        right={
          <Link
            href="/lan/kalender"
            className="rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-semibold"
          >
            Kalender
          </Link>
        }
      />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <div className="hidden items-center justify-between md:flex">
          <h1 className="heading text-[34px]">Lån</h1>
          <Link
            href="/lan/kalender"
            className="rounded-full border border-border bg-card px-4 py-2 text-[13.5px] font-semibold"
          >
            Kalender
          </Link>
        </div>

        {dueToday.map((l) => (
          <div
            key={l._id}
            className="mt-4 flex items-center justify-between gap-3 rounded-card border-[1.5px] border-warn bg-warn-light p-4"
          >
            <div>
              <p className="text-[14.5px] font-bold text-warn">
                {l.endDay < today
                  ? `Skulle lämnats ${fmtWeekday(l.endDay)} ${Number(l.endDay.slice(8))}`
                  : "Lämna tillbaka idag"}
              </p>
              <p className="text-[13px] text-body">
                {l.itemName} till {l.otherName}
              </p>
            </div>
            <button
              type="button"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-warn px-4 text-[13.5px] font-bold text-white transition-transform active:scale-[0.97]"
              onClick={async () => {
                await markReturned({ loanId: l._id as never });
                toast(`${l.otherName} får en notis. Tack för lånet!`);
              }}
            >
              Klart <Check size={15} strokeWidth={3} />
            </button>
          </div>
        ))}

        {borrowing.length > 0 && (
          <>
            <p className="label-caps mt-7">Du lånar</p>
            <div className="mt-3 flex flex-col gap-3">
              {borrowing.map((l) => (
                <LoanCard key={l._id} loan={l as LoanRow} />
              ))}
            </div>
          </>
        )}

        {lending.length > 0 && (
          <>
            <p className="label-caps mt-7">Du lånar ut</p>
            <div className="mt-3 flex flex-col gap-3">
              {lending.map((l) => (
                <LoanCard key={l._id} loan={l as LoanRow} />
              ))}
            </div>
          </>
        )}

        {history.length > 0 && (
          <>
            <p className="label-caps mt-7">Historik</p>
            <div className="mt-3 flex flex-col gap-3 opacity-70">
              {history.map((l) => (
                <LoanCard key={l._id} loan={l as LoanRow} />
              ))}
            </div>
          </>
        )}

        {visible.length === 0 && (
          <p className="mt-10 text-center text-[14.5px] text-muted">
            Inga lån än. Hitta något att låna under Utforska!
          </p>
        )}
      </div>
    </div>
  );
}
