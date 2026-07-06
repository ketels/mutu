"use client";

import { useQuery } from "convex/react";
import { Lock } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { ShedDot } from "@/components/ui/ShedDot";

type ShedRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.sheds.list>>
>[number];

export default function SkjulPage() {
  const sheds = useQuery(api.sheds.list);
  const mine = sheds?.filter((s) => s.isMine) ?? [];
  const joined = sheds?.filter((s) => !s.isMine) ?? [];

  return (
    <div>
      <MobileHeader title="Skjul" />
      <div className="px-6 pt-6 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Skjul</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          Dina kretsar. Det du lägger i ett skjul kan alla där inne låna.
        </p>

        <p className="label-caps mt-6">Mina skjul</p>
        <div className="mt-3 flex flex-col gap-3 md:grid md:grid-cols-2">
          {mine.map((s) => (
            <ShedCard key={s._id} shed={s} />
          ))}
          <Link
            href="/skjul/nytt"
            className="flex min-h-[72px] items-center justify-center rounded-card border-[1.5px] border-dashed border-dash text-[14.5px] font-semibold text-muted transition-opacity active:opacity-70"
          >
            + Nytt skjul
          </Link>
        </div>

        {joined.length > 0 && (
          <>
            <p className="label-caps mt-8">Skjul du är med i</p>
            <div className="mt-3 flex flex-col gap-3 md:grid md:grid-cols-2">
              {joined.map((s) => (
                <ShedCard key={s._id} shed={s} />
              ))}
            </div>
          </>
        )}

        {sheds?.length === 0 && (
          <p className="mt-8 text-center text-[14.5px] text-muted">
            Du är inte med i något skjul än. Skapa ett, eller be en vän om en
            inbjudningslänk.
          </p>
        )}
      </div>
    </div>
  );
}

function ShedCard({ shed }: { shed: ShedRow }) {
  return (
    <Link
      href={`/skjul/${shed._id}`}
      className="rounded-card border border-border bg-card p-[18px] transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center gap-2.5">
        <ShedDot colorIdx={shed.colorIdx} size={10} />
        <span className="heading text-[17px] tracking-[-0.02em]">
          {shed.name}
        </span>
        {shed.kind === "privat" && (
          <span className="flex items-center gap-1 rounded-full bg-divider px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted">
            <Lock size={10} strokeWidth={2.5} /> Privat
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] text-muted">
        {shed.memberCount} {shed.memberCount === 1 ? "person" : "personer"} ·{" "}
        {shed.itemCount} saker
        {shed.canShare && <> · du delar {shed.myShareCount}</>}
      </p>
      <div className="mt-3.5">
        <AvatarStack initials={shed.memberInitials} />
      </div>
    </Link>
  );
}
