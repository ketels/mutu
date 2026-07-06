"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { ProfileButton } from "@/components/nav/TopNav";
import { PhotoUpload } from "@/components/items/PhotoUpload";
import { ShedChecklist } from "@/components/items/ShedChecklist";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

/** Ändra sak: ändringar sparas direkt (ingen spara-knapp), enligt prototypen. */
export default function AndraSakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const itemId = id as Id<"items">;
  const item = useQuery(api.items.get, { itemId });
  const sheds = useQuery(api.sheds.list);
  const router = useRouter();

  if (item === null) {
    router.replace("/saker");
    return null;
  }
  if (!item || !sheds) return null;

  return (
    <div>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-divider bg-bg/90 px-4 backdrop-blur md:hidden">
        <Link href="/saker" aria-label="Tillbaka" className="p-2 text-ink">
          <ChevronLeft size={22} />
        </Link>
        <ProfileButton />
      </header>

      <div className="max-w-md px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading text-[25px] md:text-[34px]">Ändra sak</h1>
        <EditForm key={item._id} item={item} sheds={sheds} />
      </div>
    </div>
  );
}

type ItemData = NonNullable<
  ReturnType<typeof useQuery<typeof api.items.get>>
>;
type ShedData = NonNullable<ReturnType<typeof useQuery<typeof api.sheds.list>>>;

function EditForm({ item, sheds }: { item: ItemData; sheds: ShedData }) {
  const update = useMutation(api.items.update);
  const toggleShare = useMutation(api.items.toggleShare);
  const remove = useMutation(api.items.remove);
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);

  const save = async (patch: { name?: string; description?: string }) => {
    try {
      await update({ itemId: item._id, ...patch });
    } catch {
      toast("Kunde inte spara");
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-5">
      <PhotoUpload
        photoUrl={item.photoUrl}
        itemName={item.name}
        onUploaded={(photoId) => update({ itemId: item._id, photoId })}
      />

      <Input
        label="Namn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && save({ name })}
      />

      <Textarea
        label="Beskrivning"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => save({ description })}
      />

      <div>
        <p className="label-caps mb-2">Vilka skjul får låna den?</p>
        <ShedChecklist
          sheds={sheds.filter(
            (s) => s.canShare || item.shedIds.includes(s._id),
          )}
          selected={item.shedIds}
          onToggle={(shedId) => toggleShare({ itemId: item._id, shedId })}
        />
      </div>

      <p className="text-[13px] text-muted">
        Syns i {item.shedIds.length} skjul. Ändringar sparas direkt.
      </p>

      <Button
        variant="danger"
        full
        onClick={async () => {
          try {
            await remove({ itemId: item._id });
            toast(`${item.name} borttagen från Mutu`);
            router.replace("/saker");
          } catch {
            toast("Saken har ett aktivt lån och kan inte tas bort");
          }
        }}
      >
        Ta bort från Mutu
      </Button>
    </div>
  );
}
