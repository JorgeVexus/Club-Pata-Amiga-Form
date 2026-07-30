import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * CALENDARIO EDITORIAL — sección 5, punto 2.
 *
 * Se programa un año completo de una vez y el equipo le va colgando temas. La
 * gracia es ver de un vistazo qué falta por escribir: 52 huecos con su fecha
 * pesan más que una lista vacía y buenas intenciones.
 *
 * Los huecos nacen SIN brief a propósito. Un tema sin brief no se puede mandar
 * a investigar — tener a una persona al final es corrección; tenerla al
 * principio es dirección.
 */

export type Cadencia = "diaria" | "semanal" | "mensual";

export type Programacion = {
  id: string;
  cadence: Cadencia;
  /** 1 = lunes … 7 = domingo. Solo para 'semanal'. */
  weekday: number | null;
  /** 1..28. Solo para 'mensual'. */
  month_day: number | null;
  starts_on: string;
  ends_on: string | null;
};

/** Fecha local en formato yyyy-mm-dd, sin pasar por UTC. */
function comoFecha(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Una fecha yyyy-mm-dd leída como día local (no como medianoche UTC). */
function desdeFecha(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1);
}

/**
 * Las fechas de envío de una programación, hasta un año por corrida.
 *
 * Ojo con el día de la semana: Postgres y el equipo cuentan 1 = lunes, pero
 * `Date.getDay()` cuenta 0 = domingo. La conversión está aquí y en un solo
 * lugar, que es donde debe estar.
 */
export function fechasDeLaCadencia(
  prog: Programacion,
  hasta?: Date,
): string[] {
  const inicio = desdeFecha(prog.starts_on);
  const fin = prog.ends_on
    ? desdeFecha(prog.ends_on)
    : hasta ?? new Date(inicio.getFullYear() + 1, inicio.getMonth(), inicio.getDate());

  const fechas: string[] = [];
  // Tope duro: un año diario son 366. Más que eso es un error de captura, no
  // una intención — y llenar la tabla con basura no ayuda a nadie.
  const MAX = 400;

  if (prog.cadence === "diaria") {
    const cursor = new Date(inicio);
    while (cursor <= fin && fechas.length < MAX) {
      fechas.push(comoFecha(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return fechas;
  }

  if (prog.cadence === "semanal") {
    const objetivo = prog.weekday ?? 1; // 1 = lunes
    const cursor = new Date(inicio);
    // Adelanta hasta el primer día de la semana que toca.
    while (((cursor.getDay() + 6) % 7) + 1 !== objetivo) cursor.setDate(cursor.getDate() + 1);
    while (cursor <= fin && fechas.length < MAX) {
      fechas.push(comoFecha(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return fechas;
  }

  // Mensual: el día está acotado a 1..28 en la base justamente para que exista
  // en febrero. Nada de "31 de febrero" ni de meses que se saltan.
  const dia = prog.month_day ?? 1;
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), dia);
  if (cursor < inicio) cursor.setMonth(cursor.getMonth() + 1);
  while (cursor <= fin && fechas.length < MAX) {
    fechas.push(comoFecha(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return fechas;
}

export type ResultadoHuecos = { creados: number; yaExistian: number };

/**
 * Crea los huecos que falten para una programación.
 *
 * Se puede correr dos veces sin duplicar el año: la restricción
 * `unique (schedule_id, planned_for)` es la que lo garantiza, y aquí solo se
 * insertan los que no están.
 */
export async function generarHuecos(
  admin: Admin,
  scheduleId: string,
  creadoPor: string,
): Promise<ResultadoHuecos | { error: string }> {
  const { data: prog } = await admin
    .from("newsletter_schedule")
    .select("id, cadence, weekday, month_day, starts_on, ends_on, is_active")
    .eq("id", scheduleId)
    .maybeSingle();
  if (!prog) return { error: "Esa programación no existe." };
  if (!prog.is_active)
    return { error: "Esa programación está apagada; enciéndela antes de generar los huecos." };

  const fechas = fechasDeLaCadencia(prog as Programacion);
  if (fechas.length === 0)
    return { error: "Con esas fechas no sale ningún envío. Revisa el inicio y el fin." };

  const { data: existentes } = await admin
    .from("newsletter_topics")
    .select("planned_for")
    .eq("schedule_id", scheduleId);
  const yaHay = new Set((existentes ?? []).map((t) => t.planned_for));

  const nuevas = fechas.filter((f) => !yaHay.has(f));
  if (nuevas.length > 0) {
    const { error } = await admin.from("newsletter_topics").insert(
      nuevas.map((planned_for) => ({
        schedule_id: scheduleId,
        planned_for,
        title: "Sin título",
        created_by: creadoPor,
      })),
    );
    if (error) return { error: "No se pudieron crear los huecos." };
  }

  return { creados: nuevas.length, yaExistian: fechas.length - nuevas.length };
}

/**
 * ¿Este tema puede ir a investigación?
 *
 * Es la condición de arranque de toda la sección, así que vive en una función
 * con nombre en vez de repartida en botones.
 */
export function puedeInvestigarse(tema: {
  brief: string | null;
  title: string | null;
  status: string;
}): { ok: boolean; razon?: string } {
  if (!tema.brief || tema.brief.trim().length < 20)
    return {
      ok: false,
      razon:
        "Escribe el brief primero: qué ángulo quieres y qué debe quedar claro. Sin eso el agente inventa el rumbo.",
    };
  if (!tema.title || tema.title.trim() === "" || tema.title === "Sin título")
    return { ok: false, razon: "Ponle título al tema." };
  if (tema.status === "omitido")
    return { ok: false, razon: "Ese tema está marcado como omitido." };
  return { ok: true };
}
