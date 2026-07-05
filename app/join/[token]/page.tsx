"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { ShedDot } from "@/components/ui/ShedDot";

/**
 * Inbjudningslänk. Inloggad: acceptera direkt med bekräftelseknapp.
 * Utloggad: spara token i cookie och skicka till login — accepteras
 * automatiskt efter onboarding (hanteras av JoinTokenRedeemer).
 */
export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const preview = useQuery(api.invites.preview, { token });
  const accept = useMutation(api.invites.accept);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || redirected.current) return;
    redirected.current = true;
    document.cookie = `mutu_join_token=${token}; path=/; max-age=${7 * 24 * 3600}; samesite=lax`;
    router.replace("/login");
  }, [isLoading, isAuthenticated, token, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="heading text-[25px] lowercase">mutu.</p>
        {preview === undefined ? null : preview === null ? (
          <p className="mt-6 text-[14.5px] text-muted">
            Den här inbjudningslänken är inte giltig längre. Be om en ny.
          </p>
        ) : (
          <>
            <h1 className="heading mt-6 text-[25px] leading-tight">
              Du är inbjuden till{" "}
              <span className="inline-flex items-center gap-2">
                <ShedDot colorIdx={preview.colorIdx} size={10} />
                {preview.shedName}
              </span>
            </h1>
            <p className="mt-2 text-[14px] text-muted">
              {preview.memberCount}{" "}
              {preview.memberCount === 1 ? "person" : "personer"} delar redan
              saker här.
            </p>
            <div className="mt-6">
              <Button
                full
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    const shedId = await accept({ token });
                    router.replace(`/skjul/${shedId}`);
                  } catch {
                    setError("Kunde inte gå med — länken kan ha gått ut.");
                    setBusy(false);
                  }
                }}
              >
                Gå med i skjulet
              </Button>
              {error && (
                <p className="mt-2 text-[13px] text-warn">{error}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
