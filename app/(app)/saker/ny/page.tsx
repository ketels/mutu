"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { PhotoUpload } from "@/components/items/PhotoUpload";
import { ShedChecklist } from "@/components/items/ShedChecklist";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";

export default function NySakPage() {
  const sheds = useQuery(api.sheds.list);
  const create = useMutation(api.items.create);
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoId, setPhotoId] = useState<Id<"_storage"> | undefined>();
  const [selected, setSelected] = useState<Id<"sheds">[]>([]);
  const [busy, setBusy] = useState(false);

  const canSubmit = name.trim().length > 0 && selected.length > 0 && !busy;

  return (
    <div>
      <MobileHeader title="Lägg till en sak" />
      <div className="max-w-md px-6 pt-6 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">
          Lägg till en sak
        </h1>

        <form
          className="mt-2 flex flex-col gap-5 md:mt-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            setBusy(true);
            try {
              await create({
                name,
                description: description || undefined,
                photoId,
                shedIds: selected,
              });
              router.replace("/saker");
            } finally {
              setBusy(false);
            }
          }}
        >
          <PhotoUpload photoUrl={null} onUploaded={setPhotoId} />

          <Input
            label="Vad är det?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Utskjutsstege 6 m"
            required
          />

          <Textarea
            label="Beskrivning (frivillig)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Märke, skick, vad som följer med…"
          />

          <div>
            <p className="label-caps mb-2">Vilka skjul får låna den?</p>
            {sheds && (
              <ShedChecklist
                sheds={sheds.filter((s) => s.canShare)}
                selected={selected}
                onToggle={(shedId) =>
                  setSelected((prev) =>
                    prev.includes(shedId)
                      ? prev.filter((id) => id !== shedId)
                      : [...prev, shedId],
                  )
                }
              />
            )}
            {sheds?.length === 0 && (
              <p className="text-[13.5px] text-muted">
                Du behöver vara med i ett skjul först — skapa ett under Skjul.
              </p>
            )}
          </div>

          <p className="text-[13px] text-muted">
            Bara medlemmar i valda skjul ser{" "}
            {name.trim() ? `din ${name.trim().toLowerCase()}` : "saken"}. Du
            kan ändra när som helst i Mina saker.
          </p>

          <Button type="submit" full disabled={!canSubmit}>
            {name.trim() ? `Dela ${name.trim().toLowerCase()}` : "Dela saken"}
          </Button>
        </form>
      </div>
    </div>
  );
}
