"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { ProfileButton } from "./TopNav";

/**
 * Sticky mobilheader: logga eller rubrik till vänster, profil till höger.
 * `back`: en href ger deterministisk tillbaka-länk, `true` går bakåt i historiken.
 */
export function MobileHeader({
  title,
  logo = false,
  back,
  right,
}: {
  title?: string;
  logo?: boolean;
  back?: string | true;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-divider bg-bg/90 px-6 backdrop-blur md:hidden">
      <div className="flex min-w-0 items-center gap-1">
        {back !== undefined &&
          (typeof back === "string" ? (
            <Link
              href={back}
              aria-label="Tillbaka"
              className="-ml-2.5 p-2 text-ink"
            >
              <ChevronLeft size={22} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Tillbaka"
              className="-ml-2.5 p-2 text-ink"
            >
              <ChevronLeft size={22} />
            </button>
          ))}
        {logo ? (
          <span className="heading text-[22px] lowercase">mutu.</span>
        ) : (
          <span className="heading truncate text-[17px]">{title}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {right}
        <ProfileButton />
      </div>
    </header>
  );
}
