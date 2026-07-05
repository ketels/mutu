"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { AvailabilityCalendar } from "@/components/loans/AvailabilityCalendar";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { fmtRange } from "@/lib/dates";

export default function ChatPage({
  params,
}: {
  params: Promise<{ loanId: string }>;
}) {
  const { loanId: raw } = use(params);
  const loanId = raw as Id<"loans">;
  const thread = useQuery(api.messages.forLoan, { loanId });
  const send = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);
  const acceptProposal = useMutation(api.loans.acceptProposal);
  const declineProposal = useMutation(api.loans.declineProposal);
  const toast = useToast();

  const [draft, setDraft] = useState("");
  const [proposeOpen, setProposeOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCount = thread?.messages.length ?? 0;

  useEffect(() => {
    if (msgCount > 0) {
      markRead({ loanId });
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [msgCount, loanId, markRead]);

  if (!thread) return null;
  const { loan, messages } = thread;
  const initial = loan.otherName[0]?.toUpperCase() ?? "?";
  const canRespondAsOwner =
    loan.iAmOwner && (loan.status === "pending" || loan.status === "proposed");

  return (
    <div className="fixed inset-0 z-[35] flex flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-divider bg-card px-3">
        <Link href="/lan" aria-label="Tillbaka" className="p-2 text-ink">
          <ChevronLeft size={22} />
        </Link>
        <Link
          href={`/person/${loan.otherId}`}
          className="flex min-w-0 items-center gap-3 transition-opacity active:opacity-70"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-photo font-mono text-[13px] font-bold text-body">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14.5px] font-bold">
              {loan.otherName}
            </span>
            <span className="block truncate text-[12px] text-muted">
              {loan.itemName}
            </span>
          </span>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex max-w-md flex-col gap-2.5">
          {messages.map((m) => {
            if (m.kind === "system")
              return (
                <p
                  key={m._id}
                  className="py-1 text-center text-[12px] text-faint"
                >
                  {m.body}
                </p>
              );

            if (m.kind === "period")
              return (
                <div
                  key={m._id}
                  className={`animate-bubble-up ${m.mine ? "self-end" : "self-start"}`}
                >
                  <div className="rounded-card border border-border bg-card px-4 py-3">
                    <p className="label-caps">Önskad period</p>
                    <p className="mt-0.5 text-[14.5px] font-extrabold">
                      {m.proposalStart &&
                        m.proposalEnd &&
                        fmtRange(m.proposalStart, m.proposalEnd)}
                    </p>
                  </div>
                </div>
              );

            if (m.kind === "proposal") {
              const accepted = m.proposalState === "accepted";
              const open = m.proposalState === "open";
              return (
                <div key={m._id} className="animate-bubble-up self-start">
                  <div className="min-w-56 rounded-card border-[1.5px] border-primary bg-card px-4 py-3.5">
                    {accepted ? (
                      <p className="text-[14px] font-bold text-primary">
                        ✓ Godkänt — ligger nu i din kalender
                      </p>
                    ) : (
                      <>
                        <p className="label-caps" style={{ color: "#2F5D50" }}>
                          {m.senderFirst || loan.otherFirst} föreslår
                        </p>
                        <p className="mt-0.5 text-[15px] font-extrabold">
                          {m.proposalStart &&
                            m.proposalEnd &&
                            fmtRange(m.proposalStart, m.proposalEnd)}
                        </p>
                        {open && !loan.iAmOwner && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              className="h-10 flex-1 rounded-full bg-primary text-[13.5px] font-bold text-white transition-transform active:scale-[0.97]"
                              onClick={async () => {
                                try {
                                  await acceptProposal({ loanId });
                                  toast("Lånet ligger nu i din kalender");
                                } catch {
                                  toast("Perioden är inte ledig längre");
                                }
                              }}
                            >
                              Funkar!
                            </button>
                            <button
                              type="button"
                              className="h-10 flex-1 rounded-full border border-border bg-card text-[13.5px] font-bold transition-transform active:scale-[0.97]"
                              onClick={() => declineProposal({ loanId })}
                            >
                              Annat datum
                            </button>
                          </div>
                        )}
                        {open && loan.iAmOwner && (
                          <p className="mt-2 text-[12px] text-muted">
                            Väntar på svar från {loan.otherFirst}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m._id}
                className={`max-w-[280px] animate-bubble-up rounded-2xl px-[15px] py-3 text-[14.5px] leading-snug ${
                  m.mine
                    ? "self-end rounded-br-[4px] bg-ink text-bg"
                    : "self-start rounded-bl-[4px] bg-divider-weak text-ink"
                }`}
              >
                {m.body}
              </div>
            );
          })}

          {canRespondAsOwner && (
            <div className="mt-2 flex flex-col gap-2 rounded-card border border-border bg-card p-4">
              <p className="text-[13.5px] text-muted">
                {loan.otherFirst} vill låna din {loan.itemName.toLowerCase()}{" "}
                {fmtRange(loan.startDay, loan.endDay)}.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-full bg-primary text-[14px] font-bold text-white transition-transform active:scale-[0.97]"
                  onClick={async () => {
                    try {
                      await approve({ loanId });
                      toast(`${loan.otherFirst} får en notis`);
                    } catch {
                      toast("Perioden krockar med ett annat lån");
                    }
                  }}
                >
                  Låna ut
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-full border border-border bg-card text-[14px] font-bold transition-transform active:scale-[0.97]"
                  onClick={() => setProposeOpen(true)}
                >
                  Annan tid
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-full border border-warn/30 bg-card text-[14px] font-bold text-warn transition-transform active:scale-[0.97]"
                  onClick={async () => {
                    await decline({ loanId });
                    toast("Förfrågan nekad");
                  }}
                >
                  Kan inte
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-divider bg-card p-3 pb-[max(12px,env(safe-area-inset-bottom))]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          const text = draft;
          setDraft("");
          await send({ loanId, body: text });
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Skriv ett meddelande…"
          className="h-11 flex-1 rounded-full border border-border bg-bg px-4 text-[14.5px] outline-none placeholder:text-faint focus:border-ink"
        />
        <button
          type="submit"
          aria-label="Skicka"
          disabled={!draft.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg disabled:bg-disabled"
        >
          <SendHorizontal size={18} />
        </button>
      </form>

      <ProposeSheet
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        loanId={loanId}
        itemId={null}
      />
    </div>
  );
}

/** Ägarens motförslag: välj ny period i sakens tillgänglighetskalender. */
function ProposeSheet({
  open,
  onClose,
  loanId,
}: {
  open: boolean;
  onClose: () => void;
  loanId: Id<"loans">;
  itemId: Id<"items"> | null;
}) {
  const propose = useMutation(api.loans.propose);
  const availability = useQuery(
    api.loans.availabilityForLoan,
    open ? { loanId } : "skip",
  );
  const toast = useToast();
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-6 pb-8 pt-2">
        <h2 className="heading text-[22px]">Föreslå en annan tid</h2>
        {availability && (
          <div className="mt-4">
            <AvailabilityCalendar
              today={availability.today}
              booked={availability.booked}
              selStart={selStart}
              selEnd={selEnd}
              onPick={(day) => {
                const bookedDay = availability.booked.some(
                  (b) => b.start <= day && day <= b.end,
                );
                if (day < availability.today || bookedDay) {
                  toast("Upptagen den dagen — välj en ledig");
                  return;
                }
                if (selStart === null || selEnd !== null || day < selStart) {
                  setSelStart(day);
                  setSelEnd(null);
                } else {
                  const conflict = availability.booked.some(
                    (b) => selStart <= b.end && b.start <= day,
                  );
                  if (conflict) {
                    toast("Perioden krockar med upptagna dagar");
                    return;
                  }
                  setSelEnd(day);
                }
              }}
            />
          </div>
        )}
        <div className="mt-5">
          <Button
            full
            disabled={!selStart}
            onClick={async () => {
              if (!selStart) return;
              try {
                await propose({
                  loanId,
                  startDay: selStart,
                  endDay: selEnd ?? selStart,
                });
                onClose();
                setSelStart(null);
                setSelEnd(null);
              } catch {
                toast("Kunde inte skicka förslaget");
              }
            }}
          >
            {selStart
              ? `Föreslå ${fmtRange(selStart, selEnd ?? selStart)}`
              : "Välj period först"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
