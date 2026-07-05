"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="heading text-center text-[34px] lowercase">mutu.</p>
        <h1 className="heading mt-8 text-[25px] leading-tight">
          Låna av folk <br />
          du litar på
        </h1>

        {sent ? (
          <div className="mt-6 rounded-card border border-primary/30 bg-primary-light p-5">
            <p className="text-[15px] font-bold text-primary">
              Kolla din mejl!
            </p>
            <p className="mt-1 text-[14px] text-body">
              Vi har skickat en inloggningslänk. Klicka på den så är du inne —
              inget lösenord behövs.
            </p>
          </div>
        ) : (
          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                await signIn("resend", new FormData(e.currentTarget));
                setSent(true);
              } catch {
                setError("Kunde inte skicka länken. Kontrollera adressen och försök igen.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="din@mejladress.se"
              aria-label="E-postadress"
            />
            <Button type="submit" full disabled={busy}>
              {busy ? "Skickar…" : "Skicka inloggningslänk"}
            </Button>
            {error && <p className="text-[13px] text-warn">{error}</p>}
            <p className="mt-2 text-center text-[13px] text-muted">
              Gratis, som allt på Mutu. Första gången? Länken skapar ditt
              konto.
            </p>
          </form>
        )}

        {process.env.NODE_ENV === "development" && !sent && <DevLogin />}
      </div>
    </div>
  );
}

/** Endast lokal utveckling: logga in med seedade lösenordskonton. */
function DevLogin() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-10 flex flex-col gap-2 border-t border-divider pt-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("flow", "signIn");
        try {
          await signIn("password", fd);
        } catch {
          setError("Fel e-post eller lösenord (dev)");
        }
      }}
    >
      <p className="label-caps">Dev-inloggning</p>
      <Input name="email" type="email" placeholder="dev e-post" />
      <Input name="password" type="password" placeholder="lösenord" />
      <Button type="submit" variant="outline" full>
        Logga in (dev)
      </Button>
      {error && <p className="text-[13px] text-warn">{error}</p>}
    </form>
  );
}
