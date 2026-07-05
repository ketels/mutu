"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { AvailabilityCalendar } from "@/components/loans/AvailabilityCalendar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { ShedDot } from "@/components/ui/ShedDot";
import { useToast } from "@/components/ui/Toast";
import { daysInRange, fmtRange } from "@/lib/dates";

/** Sak-detalj med tillgänglighetskalender och låneförfrågan. Bor i sheeten. */
export function ItemDetail({ itemId }: { itemId: Id<"items"> }) {
  const detail = useQuery(api.explore.itemDetail, { itemId });
  const request = useMutation(api.loans.request);
  const router = useRouter();
  const toast = useToast();

  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!detail) return <div className="min-h-64" />;

  const isBookedDay = (day: string) =>
    detail.booked.some((b) => b.start <= day && day <= b.end);

  const pick = (day: string) => {
    if (day < detail.today || isBookedDay(day)) {
      toast("Upptagen den dagen — välj en ledig");
      return;
    }
    // Första trycket = start; andra (senare) = slut; annars ny start
    if (selStart === null || selEnd !== null || day < selStart) {
      setSelStart(day);
      setSelEnd(null);
      return;
    }
    if (day === selStart) {
      setSelEnd(day);
      return;
    }
    const conflict = detail.booked.some(
      (b) => selStart <= b.end && b.start <= day,
    );
    if (conflict) {
      toast("Perioden krockar med upptagna dagar");
      return;
    }
    setSelEnd(day);
  };

  const range = selStart && (selEnd ?? selStart);
  const canAsk = selStart !== null && !busy && !detail.isMine;

  return (
    <div className="px-6 pb-8 pt-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-photo">
        {detail.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={detail.photoUrl}
            alt={detail.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute bottom-2 left-2 rounded-[4px] bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted">
            foto: {detail.name.toLowerCase()}
          </span>
        )}
      </div>

      <h2 className="heading mt-4 text-[22px]">{detail.name}</h2>
      <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted">
        {detail.viaShed && (
          <>
            <ShedDot colorIdx={detail.viaShed.colorIdx} size={6} />
            {detail.ownerFirst} via {detail.viaShed.name}
          </>
        )}
        {detail.distance && <> · {detail.distance}</>}
      </p>

      {detail.description && (
        <p className="mt-3 text-[14.5px] leading-relaxed text-body">
          {detail.description}
        </p>
      )}

      {!detail.isMine && (
        <>
          <div className="mt-6">
            <AvailabilityCalendar
              today={detail.today}
              booked={detail.booked}
              selStart={selStart}
              selEnd={selEnd}
              onPick={pick}
            />
          </div>

          {range && selStart && (
            <div className="mt-5 rounded-card border border-primary/30 bg-primary-light p-4">
              <p className="label-caps" style={{ color: "#2F5D50" }}>
                Ditt val
              </p>
              <p className="mt-1 text-[15px] font-extrabold text-primary">
                {fmtRange(selStart, range)}
              </p>
              <p className="text-[12.5px] text-primary/80">
                {daysInRange(selStart, range)}{" "}
                {daysInRange(selStart, range) === 1 ? "dag" : "dagar"}
              </p>
            </div>
          )}

          <div className="mt-5">
            <Textarea
              label={`Meddelande till ${detail.ownerFirst}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hej ${detail.ownerFirst}! Berätta gärna vad du ska använda den till…`}
            />
          </div>

          <div className="mt-5">
            <Button
              full
              disabled={!canAsk}
              onClick={async () => {
                if (!selStart) return;
                setBusy(true);
                try {
                  const loanId = await request({
                    itemId,
                    startDay: selStart,
                    endDay: selEnd ?? selStart,
                    message: message || undefined,
                  });
                  router.push(`/lan/${loanId}`);
                } catch {
                  toast("Kunde inte skicka förfrågan — försök igen");
                  setBusy(false);
                }
              }}
            >
              {selStart
                ? `Fråga ${detail.ownerFirst} · ${fmtRange(selStart, selEnd ?? selStart)}`
                : "Välj period först"}
            </Button>
            <p className="mt-2.5 text-center text-[12.5px] text-muted">
              Gratis, som allt på Mutu.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
