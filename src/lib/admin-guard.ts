import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Guard para route handlers del panel: sesión con rol admin/super_admin. */
export async function requireAdminRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") return null;
  return { adminId: user.id, admin: createAdminClient() };
}

/**
 * Rol del admin en sesión, para filtrar datos sensibles EN EL SERVIDOR
 * (admin ve lo esencial; super_admin ve identidad/bancarios/fiscales).
 * El layout de /admin ya garantiza que hay sesión con rol de admin.
 */
export async function getAdminRole(): Promise<"admin" | "super_admin"> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "admin";
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" ? "super_admin" : "admin";
}
