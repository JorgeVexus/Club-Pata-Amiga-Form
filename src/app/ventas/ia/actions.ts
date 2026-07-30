"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import { AJUSTES_IA } from "@/lib/llm/gobierno";

/**
 * Ajustes de gobierno de los agentes.
 *
 * Los interruptores que pueden dejar callado al cliente o costar dinero
 * (canales apagados, topes) son de `super_admin`. Quién está de guardia y cada
 * cuánto se recuerda una escalación los ajusta el gerente, que es quien
 * organiza el turno.
 */
export async function guardarAjustesIA(valores: Record<string, string>) {
  const { role } = await requireCapability("contactos.editar");

  const esSuper = role === "super_admin";
  const permitidas: string[] = AJUSTES_IA.filter(
    (a) => !a.soloSuper || esSuper,
  ).map((a) => a.key);

  const filas = Object.entries(valores)
    .filter(([key]) => permitidas.includes(key))
    .map(([key, value]) => ({
      key,
      value: String(value ?? "").trim(),
      updated_at: new Date().toISOString(),
    }));

  if (filas.length === 0)
    return { error: "No hay nada que puedas cambiar con tu rol." };

  const admin = createAdminClient();
  const { error } = await admin.from("site_settings").upsert(filas);
  if (error) return { error: "No se pudieron guardar los ajustes." };

  revalidatePath("/ventas/ia");
  revalidatePath("/ventas/conversaciones");
  return { ok: true as const, guardados: filas.length };
}

/**
 * Convierte lo aprendido de los votos en una instrucción adicional del agente.
 *
 * Es el único camino: los pulgares NO reentrenan nada solos. La voz de marca y
 * los límites legales no se ajustan por votación — los ajusta una persona,
 * escribiendo.
 */
export async function agregarInstruccion(agente: "sales" | "assistant", texto: string) {
  await requireCapability("contactos.fusionar"); // gerente y arriba
  const instruccion = texto.trim();
  if (!instruccion) return { error: "Escribe la instrucción." };

  const key = agente === "sales" ? "sales_extra_prompt" : "assistant_extra_prompt";
  const admin = createAdminClient();

  const { data: actual } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  const nuevo = [actual?.value, instruccion].filter(Boolean).join("\n");
  const { error } = await admin
    .from("site_settings")
    .upsert({ key, value: nuevo, updated_at: new Date().toISOString() });
  if (error) return { error: "No se pudo guardar la instrucción." };

  revalidatePath("/ventas/ia");
  revalidatePath("/admin/sitio");
  return { ok: true as const };
}
