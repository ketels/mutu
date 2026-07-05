import { MobileHeader } from "@/components/nav/MobileHeader";

export default function ProfilPage() {
  return (
    <div>
      <MobileHeader title="Profil" />
      <div className="px-6 pt-4 md:px-0 md:pt-10">
        <h1 className="heading hidden text-[34px] md:block">Profil</h1>
        <p className="mt-10 text-center text-[14.5px] text-muted">
          Konto och inställningar kopplas in i etapp 1.
        </p>
      </div>
    </div>
  );
}
