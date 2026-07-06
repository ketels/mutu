"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { type LatLng, MapPicker } from "@/components/location/MapPicker";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { Button } from "@/components/ui/Button";

export default function ProfilPage() {
  const viewer = useQuery(api.users.viewer);
  const setLocation = useMutation(api.users.setLocation);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [busy, setBusy] = useState(false);

  const saved: LatLng | null =
    viewer?.lat != null && viewer?.lng != null
      ? { lat: viewer.lat, lng: viewer.lng }
      : null;

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

            <div className="mt-4 flex flex-col gap-2">
              {editing ? (
                <>
                  <MapPicker
                    value={pos}
                    onChange={setPos}
                    className="h-72 rounded-card border border-border"
                  />
                  <div className="flex gap-2">
                    <Button
                      full
                      disabled={busy || !pos}
                      onClick={async () => {
                        if (!pos) return;
                        setBusy(true);
                        try {
                          await setLocation(pos);
                          setEditing(false);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Spara plats
                    </Button>
                    <Button
                      variant="outline"
                      full
                      disabled={busy}
                      onClick={() => setEditing(false)}
                    >
                      Avbryt
                    </Button>
                  </div>
                </>
              ) : saved ? (
                <>
                  <MapPicker
                    interactive={false}
                    value={saved}
                    className="h-36 rounded-card border border-border"
                  />
                  <p className="text-[13px] text-muted">
                    Ungefärlig position — visas aldrig för andra.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPos(saved);
                      setEditing(true);
                    }}
                  >
                    Ändra plats
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[13.5px] text-muted">Ingen plats vald</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPos(null);
                      setEditing(true);
                    }}
                  >
                    Välj plats
                  </Button>
                </>
              )}
            </div>
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
