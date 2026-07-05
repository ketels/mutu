"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill, type StatusVariant } from "@/components/ui/StatusPill";
import { fmtRange, fmtWeekday, loanProgress } from "@/lib/dates";

export type LoanRow = {
  _id: string;
  direction: "in" | "out";
  itemName: string;
  photoUrl: string | null;
  otherName: string;
  startDay: string;
  endDay: string;
  status: "pending" | "proposed" | "approved" | "returned" | "declined" | "cancelled";
  today: string;
  unread: boolean;
};

export function loanPill(loan: LoanRow): StatusVariant {
  const started = loan.startDay <= loan.today;
  const overdue = loan.status === "approved" && loan.endDay < loan.today;
  if (overdue) return "forsenad";
  switch (loan.status) {
    case "approved":
      return started ? (loan.direction === "in" ? "pagar" : "utlanad") : "godkant";
    case "pending":
      return loan.direction === "out" ? "svara" : "vantar";
    case "proposed":
      return loan.direction === "in" ? "forslag" : "vantar";
    case "declined":
    case "cancelled":
      return "nekat";
    case "returned":
      return "godkant";
  }
}

export function LoanCard({ loan }: { loan: LoanRow }) {
  const pill = loanPill(loan);
  const arrow = loan.direction === "in" ? "←" : "→";
  const active =
    loan.status === "approved" &&
    loan.startDay <= loan.today &&
    loan.endDay >= loan.today;
  const progress = active
    ? loanProgress(loan.startDay, loan.endDay, loan.today)
    : null;

  return (
    <Link
      href={`/lan/${loan._id}`}
      className="block rounded-card border border-border bg-card p-4 transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-photo">
            {loan.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={loan.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-[14.5px] font-bold">
              {loan.itemName} {arrow} {loan.otherName}
              {loan.unread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-warn" />
              )}
            </p>
            <p className="text-[12.5px] text-muted">
              {fmtRange(loan.startDay, loan.endDay)}
            </p>
          </div>
        </div>
        <StatusPill variant={pill} />
      </div>
      {progress && (
        <div className="mt-3">
          <ProgressBar
            percent={progress.percent}
            color={loan.direction === "in" ? "#2F5D50" : "#A66A2C"}
            left={`Dag ${progress.day} av ${progress.total}`}
            right={
              loan.direction === "in"
                ? `Lämnas ${fmtWeekday(loan.endDay)} ${Number(loan.endDay.slice(8))}`
                : `Hem ${fmtWeekday(loan.endDay)} ${Number(loan.endDay.slice(8))}`
            }
          />
        </div>
      )}
    </Link>
  );
}
