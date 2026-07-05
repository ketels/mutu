"use client";

import { Check } from "lucide-react";
import { type Id } from "@/convex/_generated/dataModel";
import { shedColor } from "@/lib/shed-colors";

type ShedRow = {
  _id: Id<"sheds">;
  name: string;
  colorIdx: number;
  memberCount: number;
};

/** Skjul-checklista för Lägg till/Ändra sak. Vald rad = skjulets ljusa bg. */
export function ShedChecklist({
  sheds,
  selected,
  onToggle,
}: {
  sheds: ShedRow[];
  selected: Id<"sheds">[];
  onToggle: (shedId: Id<"sheds">) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {sheds.map((s) => {
        const on = selected.includes(s._id);
        const palette = shedColor(s.colorIdx);
        return (
          <button
            key={s._id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(s._id)}
            className="flex items-center justify-between rounded-field border-[1.5px] p-3.5 text-left transition-colors"
            style={{
              background: on ? palette.light : "#FFFFFF",
              borderColor: on ? palette.color : "#E0DFD8",
            }}
          >
            <span>
              <span className="block text-[14.5px] font-bold">{s.name}</span>
              <span className="block text-[12.5px] text-muted">
                {s.memberCount} {s.memberCount === 1 ? "person" : "personer"}
              </span>
            </span>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={
                on
                  ? { background: palette.color }
                  : { border: "1.5px solid #D8D7CF" }
              }
            >
              {on && <Check size={13} color="#fff" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
