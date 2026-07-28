import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  can,
  capabilitiesOf,
  portalsOf,
  ROLE_LABELS,
  type Capabilities,
  type Capability,
  type Portal,
  type Role,
} from "@/lib/permissions";

export type PanelSession = {
  userId: string;
  role: Role;
  displayName: string;
  roleLabel: string;
  email: string | null;
  can: Capabilities;
  portals: Portal[];
};

/**
 * Sesión de trabajo del panel/portal, para los layouts.
 * Si el usuario no puede entrar al portal pedido, lo manda a donde sí puede.
 *
 * Solo servidor: llamar desde layouts, pages y route handlers.
 */
export async function requirePortal(portal: Portal): Promise<PanelSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/iniciar-sesion?next=/${portal}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, email, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "member") as Role;

  if (!can(role, `portal.${portal}` as Capability)) {
    // Si trabaja en otro portal, va al suyo; si no, al área de miembros.
    const mine = portalsOf(role);
    redirect(mine.length > 0 ? `/${mine[0]}` : "/app");
  }

  return {
    userId: user.id,
    role,
    displayName:
      profile?.first_name || profile?.email?.split("@")[0] || "Equipo",
    roleLabel: ROLE_LABELS[role],
    email: profile?.email ?? null,
    can: capabilitiesOf(role),
    portals: portalsOf(role),
  };
}

/**
 * Guard para server actions del portal de ventas: valida la capacidad del lado
 * del servidor. Ocultar el botón no basta.
 */
export async function requireCapability(capability: Capability) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "member") as Role;
  if (!can(role, capability)) throw new Error("Sin permisos");
  return { userId: user.id, role };
}
