"use client";

import { useMutation } from "convex/react";
import { Lock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { MobileHeader } from "@/components/nav/MobileHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type Kind = "delat" | "privat";

const KINDS: {
  kind: Kind;
  icon: typeof Users;
  title: string;
  desc: string;
}[] = [
  {
    kind: "delat",
    icon: Users,
    title: "Delat skjul",
    desc: "En gemensam bod. Alla medlemmar kan dela in sina saker och bjuda in fler — bra för grannar, familjen, föreningen.",
  },
  {
    kind: "privat",
    icon: Lock,
    title: "Privat skjul",
    desc: "Dina saker, din krets. Bara du lägger in saker och bjuder in — de du släpper in kan se och låna.",
  },
];

export default function NyttSkjulPage() {
  const create = useMutation(api.sheds.create);
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("delat");
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <MobileHeader title="Nytt skjul" />
      <div className="px-6 pt-6 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Nytt skjul</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          Ett skjul är en krets av folk du litar på — Vänner, Grannar,
          Bokklubben.
        </p>

        <form
          className="mt-6 flex max-w-sm flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            try {
              const shedId = await create({ name, kind });
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

          <div>
            <p className="label-caps mb-2">Vilken sorts skjul?</p>
            <div className="flex flex-col gap-2">
              {KINDS.map(({ kind: k, icon: Icon, title, desc }) => {
                const on = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setKind(k)}
                    className="rounded-field border-[1.5px] p-3.5 text-left transition-colors"
                    style={{
                      background: on ? "#EEF2F0" : "#FFFFFF",
                      borderColor: on ? "#2F5D50" : "#E0DFD8",
                    }}
                  >
                    <span className="flex items-center gap-2 text-[14.5px] font-bold">
                      <Icon size={15} strokeWidth={2.2} />
                      {title}
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-muted">
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" full disabled={busy || !name.trim()}>
            Skapa skjul
          </Button>
        </form>
      </div>
    </div>
  );
}
