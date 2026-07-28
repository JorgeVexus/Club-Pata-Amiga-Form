import { requirePortal } from "@/lib/panel-guard";
import { PanelShell } from "@/components/panel/PanelShell";
import { VentasNav, VentasNavMobile } from "@/components/panel/VentasNav";

export const metadata = { title: "Portal de ventas · Pata Amiga" };

/**
 * Portal de ventas. Usa el MISMO cascarón que /admin (PanelShell) con otro
 * menú: lo que se mejore en uno aparece en el otro.
 *
 * `requirePortal` valida el rol en el servidor y, si esta cuenta no tiene
 * acceso, la manda al portal que sí le toca (o al área de miembros).
 */
export default async function VentasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePortal("ventas");

  return (
    <PanelShell
      portal="ventas"
      session={session}
      nav={<VentasNav />}
      navMobile={<VentasNavMobile />}
    >
      {children}
    </PanelShell>
  );
}
