"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

const COOKIE = "mutu_join_token";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1];
}

/** Löser in en sparad inbjudningstoken (satt av /join när man var utloggad). */
export function JoinTokenRedeemer() {
  const viewer = useQuery(api.users.viewer);
  const accept = useMutation(api.invites.accept);
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (!viewer?.onboarded || attempted.current) return;
    const token = readCookie(COOKIE);
    if (!token) return;
    attempted.current = true;
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
    accept({ token })
      .then((shedId) => router.push(`/skjul/${shedId}`))
      .catch(() => {
        // Ogiltig/utgången token — släpp tyst, användaren är ändå inne i appen.
      });
  }, [viewer, accept, router]);

  return null;
}
