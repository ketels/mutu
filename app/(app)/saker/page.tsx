import { MobileHeader } from "@/components/nav/MobileHeader";

export default function MinaSakerPage() {
  return (
    <div>
      <MobileHeader title="Mina saker" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Mina saker</h1>
        <p className="text-[14.5px] text-muted md:mt-1.5">
          En rad per sak, en kolumn per skjul. Tryck på en prick för att dela
          eller sluta dela.
        </p>
        <p className="mt-10 text-center text-[14.5px] text-muted">
          Delningsmatrisen byggs i etapp 3.
        </p>
      </div>
    </div>
  );
}
