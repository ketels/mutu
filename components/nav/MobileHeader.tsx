import { type ReactNode } from "react";
import { ProfileButton } from "./TopNav";

/** Sticky mobilheader: logga eller rubrik till vänster, profil till höger. */
export function MobileHeader({
  title,
  logo = false,
  right,
}: {
  title?: string;
  logo?: boolean;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-divider bg-bg/90 px-6 backdrop-blur md:hidden">
      {logo ? (
        <span className="heading text-[22px] lowercase">mutu.</span>
      ) : (
        <span className="heading text-[17px]">{title}</span>
      )}
      <div className="flex items-center gap-3">
        {right}
        <ProfileButton />
      </div>
    </header>
  );
}
