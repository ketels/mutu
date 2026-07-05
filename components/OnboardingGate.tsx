"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

/** Skickar inloggade användare utan färdig profil till onboarding. */
export function OnboardingGate() {
  const viewer = useQuery(api.users.viewer);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (viewer && !viewer.onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [viewer, pathname, router]);

  return null;
}
