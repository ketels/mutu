import { MobileHeader } from "@/components/nav/MobileHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";

export default function LanPage() {
  return (
    <div>
      <MobileHeader title="Lån" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Lån</h1>

        <p className="label-caps mt-6">Du lånar</p>
        <div className="mt-3 rounded-card border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-[10px] bg-photo" />
              <div>
                <p className="text-[14.5px] font-bold">
                  Högtryckstvätt ← Marcus
                </p>
                <p className="text-[12.5px] text-muted">ons 8 → fre 17 juli</p>
              </div>
            </div>
            <StatusPill variant="pagar" />
          </div>
          <div className="mt-3">
            <ProgressBar
              percent={33}
              color="#2F5D50"
              left="Dag 3 av 9"
              right="Lämnas fre 17"
            />
          </div>
        </div>

        <p className="label-caps mt-7">Du lånar ut</p>
        <div className="mt-3 rounded-card border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-[10px] bg-photo" />
              <div>
                <p className="text-[14.5px] font-bold">Skruvdragare → Jonas</p>
                <p className="text-[12.5px] text-muted">tors 9 → sön 12 juli</p>
              </div>
            </div>
            <StatusPill variant="utlanad" />
          </div>
          <div className="mt-3">
            <ProgressBar
              percent={40}
              color="#A66A2C"
              left="Dag 2 av 4"
              right="Hem sön 12"
            />
          </div>
        </div>

        <p className="mt-10 text-center text-[14.5px] text-muted">
          Riktiga lån kopplas in i etapp 5.
        </p>
      </div>
    </div>
  );
}
