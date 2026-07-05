"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { ShedDot } from "@/components/ui/ShedDot";

export default function SkjulPage() {
  const sheds = useQuery(api.sheds.list);

  return (
    <div>
      <MobileHeader title="Skjul" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Skjul</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          Dina kretsar. Det du lägger i ett skjul kan alla där inne låna.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2">
          {sheds?.map((s) => (
            <Link
              key={s._id}
              href={`/skjul/${s._id}`}
              className="rounded-card border border-border bg-card p-[18px] transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <ShedDot colorIdx={s.colorIdx} size={10} />
                <span className="heading text-[17px] tracking-[-0.02em]">
                  {s.name}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {s.memberCount}{" "}
                {s.memberCount === 1 ? "person" : "personer"} · {s.itemCount}{" "}
                saker · du delar {s.myShareCount}
              </p>
              <div className="mt-3.5">
                <AvatarStack initials={s.memberInitials} />
              </div>
            </Link>
          ))}

          <Link
            href="/skjul/nytt"
            className="flex min-h-[72px] items-center justify-center rounded-card border-[1.5px] border-dashed border-dash text-[14.5px] font-semibold text-muted transition-opacity active:opacity-70"
          >
            + Nytt skjul
          </Link>
        </div>

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
