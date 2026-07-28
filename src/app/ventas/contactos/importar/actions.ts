"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/panel-guard";
import {
  adivinarMapeo,
  analizar,
  aplicarMapeo,
  importar,
  leerCsv,
  MAX_FILAS,
  type Analisis,
  type Mapeo,
} from "@/lib/crm/import";
import { candidatosDuplicados, mergeContacts } from "@/lib/crm/merge";

/** Tamaño máximo del texto del CSV que aceptamos de un jalón (~2 MB). */
const MAX_CARACTERES = 2_000_000;

export type LecturaCsv = {
  cabeceras: string[];
  mapeo: Mapeo;
  totalFilas: number;
  recortado: boolean;
  primeras: string[][];
};

/** Paso 1: leer el archivo y proponer el mapeo de columnas. */
export async function leerArchivo(texto: string): Promise<
  { error: string } | { ok: true; lectura: LecturaCsv }
> {
  await requireCapability("contactos.editar");
  if (texto.length > MAX_CARACTERES)
    return { error: "El archivo es muy grande. Divídelo en partes." };

  const filas = leerCsv(texto);
  if (filas.length < 2)
    return { error: "El archivo no tiene datos (o no es un CSV)." };

  const [cabeceras, ...datos] = filas;
  return {
    ok: true,
    lectura: {
      cabeceras,
      mapeo: adivinarMapeo(cabeceras),
      totalFilas: datos.length,
      recortado: datos.length > MAX_FILAS,
      primeras: datos.slice(0, 5),
    },
  };
}

/** Paso 2: vista previa. No escribe nada. */
export async function previsualizar(
  texto: string,
  mapeo: Mapeo,
): Promise<{ error: string } | { ok: true; analisis: Analisis }> {
  await requireCapability("contactos.editar");

  const filas = leerCsv(texto);
  if (filas.length < 2) return { error: "El archivo no tiene datos." };
  const datos = filas.slice(1, 1 + MAX_FILAS);

  const admin = createAdminClient();
  const analisis = await analizar(admin, aplicarMapeo(datos, mapeo));
  return { ok: true, analisis };
}

/** Paso 3: escribir. Usa la misma resolución de contactos que los webhooks. */
export async function confirmarImportacion(
  texto: string,
  mapeo: Mapeo,
  fuente: string,
) {
  const { userId } = await requireCapability("contactos.editar");

  const filas = leerCsv(texto);
  if (filas.length < 2) return { error: "El archivo no tiene datos." };
  const datos = filas.slice(1, 1 + MAX_FILAS);

  const admin = createAdminClient();
  const resultado = await importar(
    admin,
    aplicarMapeo(datos, mapeo),
    userId,
    fuente.trim() || "importación",
  );

  revalidatePath("/ventas/contactos");
  revalidatePath("/ventas");
  return { ok: true as const, resultado };
}

// ------------------------------------------------------------- duplicados --

export async function fusionar(masterId: string, otherIds: string[]) {
  // Fusionar pierde información si se hace mal: solo gerente y arriba.
  const { userId } = await requireCapability("contactos.fusionar");
  const admin = createAdminClient();

  try {
    const res = await mergeContacts(admin, { masterId, otherIds, actorId: userId });
    revalidatePath("/ventas/contactos");
    revalidatePath(`/ventas/contactos/${masterId}`);
    revalidatePath("/ventas/contactos/duplicados");
    return { ok: true as const, ...res };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo fusionar." };
  }
}

/** Marca una pareja como "no son la misma persona" para que deje de aparecer. */
export async function descartarPareja(aId: string, bId: string) {
  const { userId } = await requireCapability("contactos.editar");
  const admin = createAdminClient();

  const { data: actual } = await admin
    .from("contacts")
    .select("custom_fields")
    .eq("id", aId)
    .maybeSingle();
  const campos = { ...((actual?.custom_fields as Record<string, unknown>) ?? {}) };
  const descartados = Array.isArray(campos.__no_duplicado_de)
    ? (campos.__no_duplicado_de as string[])
    : [];
  campos.__no_duplicado_de = [...new Set([...descartados, bId])];

  await admin.from("contacts").update({ custom_fields: campos }).eq("id", aId);
  await admin.from("contact_activities").insert({
    contact_id: aId,
    kind: "nota",
    summary: "Se marcó que NO es duplicado de otro contacto",
    payload: { otro: bId },
    actor_id: userId,
  });

  revalidatePath("/ventas/contactos/duplicados");
  return { ok: true as const };
}

export async function listarDuplicados() {
  await requireCapability("contactos.ver");
  const admin = createAdminClient();
  return candidatosDuplicados(admin);
}
