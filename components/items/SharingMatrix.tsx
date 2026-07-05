"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { fmtWeekday } from "@/lib/dates";
import { shedColor } from "@/lib/shed-colors";
import { ShedDot } from "@/components/ui/ShedDot";

/**
 * Signaturmönstret: rad = egen sak, kolumn = skjul, cell = rund toggle.
 * Sakkolumnen sticky med gradient-fade; skjulkolumner à 62px, horisontell scroll.
 */
export function SharingMatrix() {
  const items = useQuery(api.items.mine);
  const sheds = useQuery(api.sheds.list);
  const toggle = useMutation(api.items.toggleShare).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.items.mine, {});
      if (!current) return;
      localStore.setQuery(
        api.items.mine,
        {},
        current.map((item) =>
          item._id === args.itemId
            ? {
                ...item,
                shedIds: item.shedIds.includes(args.shedId)
                  ? item.shedIds.filter((id) => id !== args.shedId)
                  : [...item.shedIds, args.shedId],
              }
            : item,
        ),
      );
    },
  );

  if (!items || !sheds) return null;

  if (items.length === 0) {
    return (
      <p className="mt-8 text-center text-[14.5px] text-muted">
        Du delar inget än. Lägg till din första sak!
      </p>
    );
  }

  return (
    <div className="relative -mx-6 mt-4 md:mx-0">
      <div className="scrollbar-none overflow-x-auto">
        <div className="inline-block min-w-full px-6 md:px-0">
          {/* Kolumnrubriker */}
          <div className="flex items-end pb-2">
            <div className="w-[168px] shrink-0" />
            {sheds.map((s) => (
              <div
                key={s._id}
                className="flex w-[62px] shrink-0 flex-col items-center gap-1"
              >
                <ShedDot colorIdx={s.colorIdx} size={7} />
                <span className="max-w-full truncate px-1 text-[11px] font-bold tracking-[0.03em] text-muted">
                  {s.name}
                </span>
              </div>
            ))}
          </div>

          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center border-t border-divider-weak py-3"
            >
              <Link
                href={`/saker/${item._id}`}
                className="sticky left-0 z-10 w-[168px] shrink-0 bg-bg pr-3.5"
                style={{
                  maskImage:
                    "linear-gradient(90deg, #000 calc(100% - 14px), transparent)",
                }}
              >
                <span className="flex items-center gap-0.5 text-[15px] font-bold leading-tight">
                  <span className="truncate">{item.name}</span>
                  <ChevronRight size={15} className="shrink-0 text-faint" />
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                  {item.loan
                    ? `Utlånad till ${item.loan.borrowerName} t.o.m. ${fmtWeekday(item.loan.endDay)}`
                    : item.shedIds.length === 0
                      ? "Delas inte än"
                      : "Hemma"}
                </span>
              </Link>

              {sheds.map((s) => {
                const on = item.shedIds.includes(s._id);
                const palette = shedColor(s.colorIdx);
                return (
                  <div
                    key={s._id}
                    className="flex w-[62px] shrink-0 justify-center"
                  >
                    <button
                      type="button"
                      aria-label={`${on ? "Sluta dela" : "Dela"} ${item.name} i ${s.name}`}
                      aria-pressed={on}
                      onClick={() =>
                        toggle({ itemId: item._id, shedId: s._id })
                      }
                      className="flex h-11 w-11 items-center justify-center"
                    >
                      <span
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full transition-transform active:scale-90"
                        style={
                          on
                            ? { background: palette.color }
                            : { border: "1.5px solid #D8D7CF" }
                        }
                      >
                        {on && <Check size={14} color="#fff" strokeWidth={3} />}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Gradient i högerkanten: signalerar mer innehåll */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-3.5 bg-gradient-to-l from-bg to-transparent md:hidden"
      />
    </div>
  );
}
