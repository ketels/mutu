"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { ProfileButton } from "@/components/nav/TopNav";
import { SharedShedToggle } from "@/components/sheds/SharedShedToggle";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ShedDot } from "@/components/ui/ShedDot";
import { useToast } from "@/components/ui/Toast";
import { shedColor } from "@/lib/shed-colors";

export default function SkjulDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const shedId = id as Id<"sheds">;
  const shed = useQuery(api.sheds.get, { shedId });
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!shed) return null;
  const palette = shedColor(shed.colorIdx);

  return (
    <div>
      {/* Mobil: rubrik + Bjud in i headern, enligt mockupen */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-1.5 border-b border-divider bg-bg/90 px-4 backdrop-blur md:hidden">
        <Link
          href="/skjul"
          aria-label="Tillbaka"
          className="-ml-1 shrink-0 p-2 text-ink"
        >
          <ChevronLeft size={22} />
        </Link>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <ShedDot colorIdx={shed.colorIdx} size={10} />
          <span className="heading truncate text-[17px]">{shed.name}</span>
        </span>
        {shed.canContribute && (
          <button
            type="button"
            className="h-9 shrink-0 rounded-full bg-ink px-3.5 text-[13px] font-bold text-bg transition-transform active:scale-[0.97]"
            onClick={() => setInviteOpen(true)}
          >
            Bjud in
          </button>
        )}
        <ProfileButton />
      </header>

      <div className="px-6 pt-4 md:px-0 md:pt-10">
        {/* Desktop: rubrikraden ligger i innehållet som förut */}
        <div className="hidden items-center justify-between gap-4 md:flex">
          <div className="flex items-center gap-3">
            <ShedDot colorIdx={shed.colorIdx} size={12} />
            <h1 className="heading text-[34px]">{shed.name}</h1>
          </div>
          {shed.canContribute && (
            <button
              type="button"
              className="h-10 shrink-0 rounded-full bg-ink px-4 text-[13.5px] font-bold text-bg transition-transform active:scale-[0.97]"
              onClick={() => setInviteOpen(true)}
            >
              Bjud in
            </button>
          )}
        </div>
        <p className="text-[13.5px] text-muted md:mt-1">
          {shed.members.length}{" "}
          {shed.members.length === 1 ? "person" : "personer"} ·{" "}
          {shed.items.length} saker
          {shed.canContribute && <> · du delar {shed.myItems.length}</>}
        </p>
        {shed.kind === "privat" && !shed.iAmOwner && (
          <p className="mt-1.5 text-[12.5px] text-muted">
            {shed.ownerFirst} lägger in sakerna och bjuder in här.
          </p>
        )}

        <p className="label-caps mt-7">Personer</p>
        <div className="mt-3 flex flex-col divide-y divide-divider-weak rounded-card border border-border bg-card">
          {shed.members.map((m) =>
            m.isMe ? (
              <div key={m.userId} className="flex items-center gap-3 p-3.5">
                <MemberAvatar initials={m.initials} />
                <p className="text-[14.5px] font-bold">
                  {m.name}{" "}
                  <span className="font-normal text-muted">(du)</span>
                </p>
              </div>
            ) : (
              <Link
                key={m.userId}
                href={`/person/${m.userId}`}
                className="flex items-center gap-3 p-3.5 transition-opacity active:opacity-70"
              >
                <MemberAvatar initials={m.initials} />
                <p className="flex-1 text-[14.5px] font-bold">{m.name}</p>
                <ChevronRight size={16} className="text-faint" />
              </Link>
            ),
          )}
        </div>

        {shed.canContribute && (
          <>
            <p className="label-caps mt-7">Du delar hit</p>
            {shed.myItems.length === 0 ? (
              <p className="mt-2 text-[14px] text-muted">
                Inget än — slå på i{" "}
                <Link href="/saker" className="font-semibold underline">
                  Mina saker
                </Link>
                .
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {shed.myItems.map((item) => (
                  <span
                    key={item._id}
                    className="rounded-full border px-3.5 py-2 text-[13.5px] font-semibold"
                    style={{
                      background: palette.light,
                      borderColor: palette.color + "55",
                      color: palette.color,
                    }}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        <p className="label-caps mt-7">I skjulet</p>
        <div className="mt-3 flex flex-col divide-y divide-divider-weak rounded-card border border-border bg-card">
          {shed.items.length === 0 && (
            <p className="p-4 text-[14px] text-muted">
              Tomt än så länge. Sakerna dyker upp här när medlemmarna delar
              något.
            </p>
          )}
          {shed.items.map((item) => (
            <div key={item._id} className="flex items-center gap-3 p-3.5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-photo">
                {item.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14.5px] font-bold">
                  {item.name}
                  {item.isMine && (
                    <span className="rounded-[4px] bg-divider px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.05em] text-muted">
                      DIN
                    </span>
                  )}
                </p>
                <p className="text-[12.5px] text-muted">{item.ownerName}</p>
              </div>
            </div>
          ))}
        </div>

        {shed.iAmOwner && <OwnerSettings shed={shed} />}
      </div>

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        shedId={shedId}
        shedName={shed.name}
      />
    </div>
  );
}

function OwnerSettings({
  shed,
}: {
  shed: { _id: Id<"sheds">; kind: "delat" | "privat" };
}) {
  const setKind = useMutation(api.sheds.setKind);
  const toast = useToast();
  const shared = shed.kind === "delat";
  return (
    <div className="mt-8 pb-4">
      <p className="label-caps mb-2">Inställningar</p>
      <div className="max-w-sm">
        <SharedShedToggle
          on={shared}
          onToggle={async () => {
            await setKind({
              shedId: shed._id,
              kind: shared ? "privat" : "delat",
            });
            toast(
              shared
                ? "Nu lägger bara du in saker och bjuder in"
                : "Nu kan alla medlemmar dela in saker och bjuda in",
            );
          }}
        />
      </div>
    </div>
  );
}

function MemberAvatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-photo font-mono text-[12px] font-bold text-body">
      {initials}
    </span>
  );
}

/**
 * Bjud in: bocka i folk du redan delar skjul med och lägg till dem direkt,
 * eller kopiera länken för folk som är nya på Mutu.
 */
function InviteSheet({
  open,
  onClose,
  shedId,
  shedName,
}: {
  open: boolean;
  onClose: () => void;
  shedId: Id<"sheds">;
  shedName: string;
}) {
  const candidates = useQuery(
    api.people.inviteCandidates,
    open ? { shedId } : "skip",
  );
  const addToShed = useMutation(api.people.addToShed);
  const createInvite = useMutation(api.invites.createForShed);
  const toast = useToast();
  const [selected, setSelected] = useState<Id<"users">[]>([]);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close}>
      <div className="px-6 pb-8 pt-2">
        <h2 className="heading text-[22px]">Bjud in till {shedName}</h2>

        {candidates && candidates.length > 0 && (
          <>
            <p className="label-caps mt-5">Folk du redan känner</p>
            <div className="mt-3 flex flex-col divide-y divide-divider-weak rounded-card border border-border bg-card">
              {candidates.map((c) => {
                const on = selected.includes(c.userId);
                return (
                  <button
                    key={c.userId}
                    type="button"
                    aria-pressed={on}
                    className="flex items-center gap-3 p-3.5 text-left"
                    onClick={() =>
                      setSelected((prev) =>
                        on
                          ? prev.filter((id) => id !== c.userId)
                          : [...prev, c.userId],
                      )
                    }
                  >
                    <MemberAvatar initials={c.initials} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-bold">
                        {c.name}
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">
                        via {c.via}
                      </span>
                    </span>
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={
                        on
                          ? { background: "#2F5D50" }
                          : { border: "1.5px solid #D8D7CF" }
                      }
                    >
                      {on && <Check size={13} color="#fff" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Button
                full
                disabled={selected.length === 0 || busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    for (const userId of selected) {
                      await addToShed({ shedId, userId });
                    }
                    toast(
                      selected.length === 1
                        ? "Tillagd i skjulet"
                        : `${selected.length} personer tillagda`,
                    );
                    close();
                  } catch {
                    toast("Kunde inte lägga till — försök igen");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {selected.length === 0
                  ? "Välj vilka du vill lägga till"
                  : `Lägg till ${selected.length} ${selected.length === 1 ? "person" : "personer"}`}
              </Button>
            </div>
          </>
        )}

        <p className="label-caps mt-6">Ny på Mutu?</p>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Skicka länken till någon som inte är med än — den gäller i 30 dagar.
        </p>
        <div className="mt-3">
          <Button
            variant="outline"
            full
            onClick={async () => {
              const token = await createInvite({ shedId });
              const url = `${window.location.origin}/join/${token}`;
              await navigator.clipboard.writeText(url);
              toast("Inbjudningslänk kopierad");
            }}
          >
            Kopiera inbjudningslänk
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
