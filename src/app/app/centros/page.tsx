import { fetchApprovedCenters } from "@/lib/centers";
import { CentersExplorer } from "@/components/centros/CentersExplorer";

export default async function CentrosPage() {
  const centers = await fetchApprovedCenters();
  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] text-ink-title">
          Centros aliados
        </h1>
        <p className="text-sm text-ink-secondary">
          Beneficios exclusivos para miembros — y recuerda: siempre puedes
          seguir con tu veterinario de confianza.
        </p>
      </div>
      <CentersExplorer centers={centers} />
    </div>
  );
}
