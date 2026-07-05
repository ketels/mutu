"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { ProfileButton } from "@/components/nav/TopNav";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { ShedDot } from "@/components/ui/ShedDot";
import { useToast } from "@/components/ui/Toast";
import { shedColor } from "@/lib/shed-colors";

export default function SkjulDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const shed = useQuery(api.sheds.get, { shedId: id as Id<"sheds"> });
  const createInvite = useMutation(api.invites.createForShed);
  const toast = useToast();

  if (!shed) return null;
  const palette = shedColor(shed.colorIdx);

  return (
    <div>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-bg/90 px-4 backdrop-blur md:hidden">
        <Link href="/skjul" aria-label="Tillbaka" className="p-2 text-ink">
          <ChevronLeft size={22} />
        </Link>
        <ProfileButton />
      </header>

      <div className="px-6 pt-2 md:px-0 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShedDot colorIdx={shed.colorIdx} size={12} />
            <h1 className="heading text-[25px] md:text-[34px]">{shed.name}</h1>
          </div>
          <button
            type="button"
            className="h-10 shrink-0 rounded-full bg-ink px-4 text-[13.5px] font-bold text-bg transition-transform active:scale-[0.97]"
            onClick={async () => {
              const token = await createInvite({ shedId: shed._id });
              const url = `${window.location.origin}/join/${token}`;
              await navigator.clipboard.writeText(url);
              toast("Inbjudningslänk kopierad");
            }}
          >
            Bjud in
          </button>
        </div>
        <p className="mt-1 text-[13.5px] text-muted">
          {shed.members.length}{" "}
          {shed.members.length === 1 ? "person" : "personer"} ·{" "}
          {shed.items.length} saker · du delar {shed.myItems.length}
        </p>

        <div className="mt-4">
          <AvatarStack
            initials={shed.members.map((m) => m.initials)}
            max={8}
          />
        </div>

        <p className="label-caps mt-8">Du delar hit</p>
        {shed.myItems.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted">
            Inget än — slå på i{" "}
            <Link href="/saker" className="font-semibold underline">
              Mina saker
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {shed.myItems.map((item) => (
              <span
                key={item._id}
                className="rounded-full border px-3.5 py-2 text-[13.5px] font-semibold"
                style={{
                  background: palette.light,
                  borderColor: palette.color + "55",
                  color: palette.color,
                }}
              >
                {item.name}
              </span>
            ))}
          </div>
        )}

        <p className="label-caps mt-8">I skjulet</p>
        <div className="mt-3 flex flex-col divide-y divide-divider-weak rounded-card border border-border bg-card">
          {shed.items.length === 0 && (
            <p className="p-4 text-[14px] text-muted">
              Tomt än så länge. Sakerna dyker upp här när medlemmarna delar
              något.
            </p>
          )}
          {shed.items.map((item) => (
            <div key={item._id} className="flex items-center gap-3 p-3.5">
              <div className="h-10 w-10 shrink-0 rounded-[10px] bg-photo" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14.5px] font-bold">
                  {item.name}
                  {item.isMine && (
                    <span className="rounded-[4px] bg-divider px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.05em] text-muted">
                      DIN
                    </span>
                  )}
                </p>
                <p className="text-[12.5px] text-muted">{item.ownerName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
