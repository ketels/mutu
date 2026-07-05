import { MobileHeader } from "@/components/nav/MobileHeader";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { ShedDot } from "@/components/ui/ShedDot";
import { MOCK_ITEMS, MOCK_SHEDS } from "@/lib/mock";

export default function SkjulPage() {
  return (
    <div>
      <MobileHeader title="Skjul" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Skjul</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          Dina kretsar. Det du lägger i ett skjul kan alla där inne låna.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2">
          {MOCK_SHEDS.map((s) => {
            const count = MOCK_ITEMS.filter((i) => i.shedId === s.id).length;
            return (
              <div
                key={s.id}
                className="rounded-card border border-border bg-card p-[18px]"
              >
                <div className="flex items-center gap-2.5">
                  <ShedDot colorIdx={s.colorIdx} size={10} />
                  <span className="heading text-[17px] tracking-[-0.02em]">
                    {s.name}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {s.metaBase} · {count} saker · du delar 0
                </p>
                <div className="mt-3.5">
                  <AvatarStack initials={s.members} />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="flex min-h-24 items-center justify-center rounded-card border-[1.5px] border-dashed border-dash text-[14.5px] font-semibold text-muted transition-opacity active:opacity-70"
          >
            + Nytt skjul
          </button>
        </div>
      </div>
    </div>
  );
}
