import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { PanelShell } from "@/components/panel/PanelShell";
import { AdminNav, AdminNavMobile } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Valida rol y devuelve capacidades y portales disponibles (para el
  // conmutador del menú de perfil).
  const session = await requirePortal("admin");

  // Contadores de las colas para los badges de la barra lateral
  // (service role: los conteos abarcan a todos los miembros)
  const admin = createAdminClient();
  const [petsQ, reimbQ, ambQ, centersQ, appealsQ] = await Promise.all([
    admin
      .from("pets")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending")
      .eq("is_active", true),
    admin
      .from("reimbursements")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_review"]),
    admin
      .from("ambassadors")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("wellness_centers")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("appeals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const navProps = {
    petsPending: petsQ.count ?? 0,
    reimbursementsPending: reimbQ.count ?? 0,
    ambassadorsPending: ambQ.count ?? 0,
    centersPending: centersQ.count ?? 0,
    appealsPending: appealsQ.count ?? 0,
    isSuper: session.role === "super_admin",
  };

  return (
    <PanelShell
      portal="admin"
      session={session}
      nav={<AdminNav {...navProps} />}
      navMobile={<AdminNavMobile {...navProps} />}
    >
      {children}
    </PanelShell>
  );
}
