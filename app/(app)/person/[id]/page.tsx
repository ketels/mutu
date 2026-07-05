"use client";

import { useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { ProfileButton } from "@/components/nav/TopNav";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemDetail } from "@/components/items/ItemDetail";
import { LoanCard, type LoanRow } from "@/components/loans/LoanCard";
import { Sheet } from "@/components/ui/Sheet";
import { ShedDot } from "@/components/ui/ShedDot";
import { shedColor } from "@/lib/shed-colors";

export default function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const person = useQuery(api.people.profile, {
    userId: id as Id<"users">,
  });
  const [openItemId, setOpenItemId] = useState<Id<"items"> | null>(null);

  if (person === null) {
    router.replace("/profil");
    return null;
  }
  if (!person) return null;

  return (
    <div>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-divider bg-bg/90 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Tillbaka"
          className="p-2 text-ink"
        >
          <ChevronLeft size={22} />
        </button>
        <ProfileButton />
      </header>

      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-photo font-mono text-[18px] font-bold text-body">
            {person.initials}
          </span>
          <div>
            <h1 className="heading text-[25px] md:text-[34px]">
              {person.name}
            </h1>
            {person.distance && (
              <p className="text-[13.5px] text-muted">{person.distance} bort</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {person.sharedSheds.map((s) => {
            const palette = shedColor(s.colorIdx);
            return (
              <span
                key={s._id}
                className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13.5px] font-semibold"
                style={{
                  background: palette.light,
                  borderColor: palette.color + "55",
                  color: palette.color,
                }}
              >
                <ShedDot colorIdx={s.colorIdx} size={7} />
                {s.name}
              </span>
            );
          })}
        </div>

        <p className="label-caps mt-8">Saker du kan låna</p>
        {person.items.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted">
            {person.name.split(" ")[0]} delar inget med dig än.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-3.5 gap-y-7 md:grid-cols-4 md:gap-x-6">
            {person.items.map((item) => (
              <ItemCard
                key={item._id}
                name={item.name}
                photoUrl={item.photoUrl}
                colorIdx={item.shedColorIdx}
                meta=""
                onClick={() => setOpenItemId(item._id)}
              />
            ))}
          </div>
        )}

        {person.loans.length > 0 && (
          <>
            <p className="label-caps mt-8">Lån er emellan</p>
            <div className="mt-3 flex flex-col gap-3 pb-8">
              {person.loans.map((l) => (
                <LoanCard key={l._id} loan={l as LoanRow} />
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet open={openItemId !== null} onClose={() => setOpenItemId(null)}>
        {openItemId && <ItemDetail itemId={openItemId} />}
      </Sheet>
    </div>
  );
}
