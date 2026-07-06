"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { Button } from "@/components/ui/Button";

export default function ProfilPage() {
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <div>
      <MobileHeader title="Profil" back />
      <div className="px-6 pt-6 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Profil</h1>

        {viewer && (
          <div className="mt-4 rounded-card border border-border bg-card p-5">
            <p className="text-[17px] font-extrabold tracking-[-0.02em]">
              {viewer.name ?? "Namnlös"}
            </p>
            <p className="mt-1 text-[13.5px] text-muted">{viewer.email}</p>
            {viewer.addressText && (
              <p className="mt-1 text-[13.5px] text-muted">
                {viewer.addressText}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 max-w-xs">
          <Button
            variant="outline"
            full
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
          >
            Logga ut
          </Button>
        </div>
      </div>
    </div>
  );
}
