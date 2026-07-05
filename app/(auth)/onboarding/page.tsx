"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type Step = "name" | "address" | "confirm";

export default function OnboardingPage() {
  const router = useRouter();
  const viewer = useQuery(api.users.viewer);
  const setName = useMutation(api.users.setName);
  const geocode = useAction(api.users.geocodeAddress);
  const complete = useMutation(api.users.completeOnboarding);

  const [step, setStep] = useState<Step>("name");
  const [name, setNameInput] = useState("");
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (viewer === undefined) return null;
  if (viewer === null) {
    router.replace("/login");
    return null;
  }
  if (viewer.onboarded) {
    router.replace("/");
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="heading text-center text-[25px] lowercase">mutu.</p>

        {step === "name" && (
          <form
            className="mt-8 flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) return;
              setBusy(true);
              try {
                await setName({ name });
                setStep("address");
              } finally {
                setBusy(false);
              }
            }}
          >
            <h1 className="heading text-[25px] leading-tight">
              Vad heter du?
            </h1>
            <p className="text-[14px] text-muted">
              Ditt namn visas för medlemmarna i dina skjul.
            </p>
            <Input
              value={name}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="För- och efternamn"
              autoFocus
              required
            />
            <Button type="submit" full disabled={busy || !name.trim()}>
              Fortsätt
            </Button>
          </form>
        )}

        {step === "address" && (
          <form
            className="mt-8 flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!address.trim()) return;
              setBusy(true);
              setError(null);
              try {
                const result = await geocode({ address });
                if (!result) {
                  setError(
                    "Hittade inte adressen — prova med gata, nummer och ort.",
                  );
                } else {
                  setDisplayName(result.displayName);
                  setStep("confirm");
                }
              } catch {
                setError("Något gick fel vid uppslaget. Försök igen.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <h1 className="heading text-[25px] leading-tight">Var bor du?</h1>
            <p className="text-[14px] text-muted">
              Adressen används bara för att visa ungefärligt avstånd till
              saker, t.ex. &ldquo;300 m&rdquo;. Den visas aldrig exakt för
              andra.
            </p>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Björkvägen 12, Tullinge"
              autoFocus
              required
            />
            <Button type="submit" full disabled={busy || !address.trim()}>
              {busy ? "Slår upp…" : "Fortsätt"}
            </Button>
            {error && <p className="text-[13px] text-warn">{error}</p>}
          </form>
        )}

        {step === "confirm" && (
          <div className="mt-8 flex flex-col gap-3">
            <h1 className="heading text-[25px] leading-tight">
              Stämmer det här läget?
            </h1>
            <div className="rounded-card border border-border bg-card p-4 text-[14px] text-body">
              {displayName}
            </div>
            <Button
              full
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await complete();
                  router.replace("/");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Ja, det stämmer
            </Button>
            <Button
              variant="outline"
              full
              onClick={() => {
                setDisplayName(null);
                setStep("address");
              }}
            >
              Nej, ändra adress
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
