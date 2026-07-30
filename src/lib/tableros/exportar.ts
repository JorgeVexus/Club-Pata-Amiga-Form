import type { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/permissions";
import { can } from "@/lib/permissions";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * EXPORTAR A CSV — sección 7, punto 5.3.
 *
 * Dos reglas:
 *
 *  1. **El CSV respeta los permisos.** Un `ventas` no puede bajar columnas que
 *     no puede ver en pantalla. Y no se resuelve escondiendo la columna al
 *     final: las columnas prohibidas ni siquiera se piden a la base.
 *  2. **Cada exportación deja rastro.** Quién, qué, cuándo y con qué columnas.
 *     Un CSV con datos de clientes que sale sin registro es un agujero.
 */

export type Columna = {
  llave: string;
  titulo: string;
  /** Si se declara, solo quien tenga esa capacidad recibe la columna. */
  requiere?: "miembro.sensible" | "miembro.expediente";
};

/** Escapa un valor para CSV: comillas, comas y saltos de línea. */
function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Arma el CSV con las columnas que ese rol sí puede llevarse.
 *
 * Devuelve también las columnas incluidas para poder registrarlas: saber que
 * "salió un CSV" sirve de poco; lo que importa es qué traía.
 */
export function armarCsv(
  filas: Record<string, unknown>[],
  columnas: Columna[],
  rol: Role,
): { csv: string; columnas: string[] } {
  const permitidas = columnas.filter((c) => !c.requiere || can(rol, c.requiere));
  const encabezado = permitidas.map((c) => celda(c.titulo)).join(",");
  const cuerpo = filas
    .map((f) => permitidas.map((c) => celda(f[c.llave])).join(","))
    .join("\n");

  // BOM al inicio: sin él, Excel en Windows abre los acentos rotos y el equipo
  // concluye que la plataforma exporta mal.
  return {
    csv: `﻿${encabezado}\n${cuerpo}`,
    columnas: permitidas.map((c) => c.llave),
  };
}

/** Deja constancia de una exportación. Nunca lanza: el registro no debe romperla. */
export async function registrarExportacion(
  admin: Admin,
  datos: {
    userId: string;
    rol: Role;
    recurso: string;
    filtros?: Record<string, unknown>;
    filas: number;
    columnas: string[];
  },
): Promise<void> {
  try {
    await admin.from("export_log").insert({
      user_id: datos.userId,
      rol: datos.rol,
      recurso: datos.recurso,
      filtros: datos.filtros ?? {},
      filas: datos.filas,
      columnas: datos.columnas,
    });
  } catch (err) {
    console.error("[tablero] no se pudo registrar la exportación", err);
  }
}

/** Columnas del CSV de oportunidades del embudo. */
export const COLUMNAS_EMBUDO: Columna[] = [
  { llave: "etapa", titulo: "Etapa" },
  { llave: "titulo", titulo: "Oportunidad" },
  { llave: "contacto", titulo: "Contacto" },
  { llave: "valor", titulo: "Valor MXN" },
  { llave: "estado", titulo: "Estado" },
  { llave: "propietario", titulo: "Propietario" },
  { llave: "creada", titulo: "Creada" },
  // El correo del contacto es dato de expediente: ventas no se lo lleva.
  { llave: "correo", titulo: "Correo", requiere: "miembro.expediente" },
];
