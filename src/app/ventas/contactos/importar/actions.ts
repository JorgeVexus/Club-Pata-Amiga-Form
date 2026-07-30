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

/**
 * Cuántas filas escribe cada llamada.
 *
 * La importación va por lotes porque cada fila son varias consultas (resolver
 * identidades, etiquetas, tarjeta) y el histórico completo se pasaría del
 * tiempo límite de una acción de servidor. De paso, la pantalla puede mostrar
 * el avance en lugar de quedarse pensando cinco minutos, y si algo truena se
 * sabe exactamente en qué fila.
 *
 * Sin `export`: un archivo "use server" solo puede exportar funciones async, y
 * ni `tsc` ni el lint lo atrapan — truena hasta el build.
 */
const TAMANO_LOTE = 50;

/** Paso 3: escribir un lote. Usa la misma resolución que los webhooks. */
export async function confirmarImportacion(
  texto: string,
  mapeo: Mapeo,
  fuente: string,
  opciones: { colocarEnPipeline?: boolean } = {},
  desde = 0,
) {
  const { userId } = await requireCapability("contactos.editar");

  const filas = leerCsv(texto);
  if (filas.length < 2) return { error: "El archivo no tiene datos." };
  const datos = filas.slice(1, 1 + MAX_FILAS);
  const lote = datos.slice(desde, desde + TAMANO_LOTE);
  if (lote.length === 0) return { error: "No quedan filas por importar." };

  const admin = createAdminClient();
  const resultado = await importar(
    admin,
    aplicarMapeo(lote, mapeo),
    userId,
    fuente.trim() || "importación",
    opciones,
  );

  const siguiente = desde + lote.length;
  const termino = siguiente >= datos.length;
  if (termino) {
    revalidatePath("/ventas/contactos");
    revalidatePath("/ventas/pipelines");
    revalidatePath("/ventas");
  }
  return { ok: true as const, resultado, siguiente, total: datos.length, termino };
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
