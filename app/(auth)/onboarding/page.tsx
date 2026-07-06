"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { type LatLng, MapPicker } from "@/components/location/MapPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type Step = "name" | "plats";

export default function OnboardingPage() {
  const router = useRouter();
  const viewer = useQuery(api.users.viewer);
  const setName = useMutation(api.users.setName);
  const setLocation = useMutation(api.users.setLocation);
  const complete = useMutation(api.users.completeOnboarding);

  const [step, setStep] = useState<Step>("name");
  const [name, setNameInput] = useState("");
  const [pos, setPos] = useState<LatLng | null>(null);
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
                setStep("plats");
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

        {step === "plats" && (
          <div className="mt-8 flex flex-col gap-3">
            <h1 className="heading text-[25px] leading-tight">
              Var bor du ungefär?
            </h1>
            <p className="text-[14px] text-muted">
              Tryck på kartan för att markera var du bor. Vi sparar bara en
              ungefärlig position (ca 100 m) — aldrig din adress, och den
              visas aldrig för andra. Den används bara för avstånd, t.ex.
              &ldquo;300 m&rdquo;.
            </p>
            <MapPicker
              value={pos}
              onChange={setPos}
              className="h-72 rounded-card border border-border"
            />
            <Button
              full
              disabled={busy || !pos}
              onClick={async () => {
                if (!pos) return;
                setBusy(true);
                setError(null);
                try {
                  await setLocation(pos);
                  await complete();
                  router.replace("/");
                } catch {
                  setError("Kunde inte spara platsen. Försök igen.");
                  setBusy(false);
                }
              }}
            >
              Fortsätt
            </Button>
            {error && <p className="text-[13px] text-warn">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
