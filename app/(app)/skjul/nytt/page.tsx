"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export default function NyttSkjulPage() {
  const create = useMutation(api.sheds.create);
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <MobileHeader title="Nytt skjul" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Nytt skjul</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          Ett skjul är en krets av folk du litar på — Vänner, Grannar,
          Bokklubben. Du väljer sen sak för sak vad som delas här.
        </p>

        <form
          className="mt-6 flex max-w-sm flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            try {
              const shedId = await create({ name });
              router.replace(`/skjul/${shedId}`);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            label="Vad ska kretsen heta?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grannar"
            autoFocus
            required
          />
          <Button type="submit" full disabled={busy || !name.trim()}>
            Skapa skjul
          </Button>
        </form>
      </div>
    </div>
  );
}
