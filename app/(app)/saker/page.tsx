"use client";

import Link from "next/link";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { SharingMatrix } from "@/components/items/SharingMatrix";

export default function MinaSakerPage() {
  return (
    <div>
      <MobileHeader title="Mina saker" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Mina saker</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          En rad per sak, en kolumn per skjul. Tryck på en prick för att dela
          eller sluta dela.
        </p>

        <SharingMatrix />

        <Link
          href="/saker/ny"
          className="mt-6 flex h-12 items-center justify-center rounded-full border-[1.5px] border-dashed border-dash text-[14.5px] font-semibold text-muted transition-opacity active:opacity-70 md:max-w-xs"
        >
          + Lägg till en sak
        </Link>
      </div>
    </div>
  );
}
