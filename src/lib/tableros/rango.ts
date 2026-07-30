/**
 * RANGOS DE FECHA DEL TABLERO — sección 7, punto 3.
 *
 * La regla que manda: **todo período viene con su anterior**. Un número sin
 * referencia no informa — 42 prospectos no dice nada hasta saber que el mes
 * pasado fueron 30.
 *
 * La aritmética de zona horaria NO vive aquí: está en `@/lib/zona-horaria`, que
 * la usa toda la plataforma. Este módulo solo arma períodos con ella.
 */
import {
  diaEnMexico,
  finDelDia,
  inicioDelDia,
} from "@/lib/zona-horaria";

// Se re-exportan para que el tablero (que ya importa de aquí) no tenga que
// importar de dos lados. El dueño de la aritmética sigue siendo zona-horaria:
// si necesitas la hora de México en cualquier otra parte, impórtala de allá.
export { diaEnMexico, finDelDia, inicioDelDia };

export type Preset =
  | "mes_actual"
  | "mes_pasado"
  | "ultimos_30"
  | "ultimos_90"
  | "anio"
  | "personalizado";

export type Rango = { desde: Date; hasta: Date; etiqueta: string };

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Partes del día mexicano de un instante, para armar meses y años. */
function partesMx(instante: Date) {
  const [anio, mes, dia] = diaEnMexico(instante).split("-").map(Number);
  return { anio, mes, dia };
}

/** yyyy-mm-dd de un año/mes/día, con el mes en base 1. */
function comoDia(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Cuántos días tiene ese mes (mes en base 1). */
function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/**
 * El rango de un preset. `ahora` se recibe en lugar de leer el reloj para que
 * el resultado sea el mismo en el servidor y en el navegador — la regla que
 * dejó el lote de arreglos sobre `Date.now()` en render.
 */
export function rangoDe(preset: Preset, ahora: Date = new Date()): Rango {
  const { anio, mes } = partesMx(ahora);
  const hoyMx = diaEnMexico(ahora);

  switch (preset) {
    case "mes_pasado": {
      const anioPrevio = mes === 1 ? anio - 1 : anio;
      const mesPrevio = mes === 1 ? 12 : mes - 1;
      return {
        desde: inicioDelDia(comoDia(anioPrevio, mesPrevio, 1)),
        hasta: finDelDia(comoDia(anioPrevio, mesPrevio, diasDelMes(anioPrevio, mesPrevio))),
        etiqueta: `${MESES[mesPrevio - 1]} ${anioPrevio}`,
      };
    }
    case "ultimos_30":
    case "ultimos_90": {
      const dias = preset === "ultimos_30" ? 29 : 89;
      const desde = new Date(inicioDelDia(hoyMx).getTime() - dias * 86400000);
      return {
        desde: inicioDelDia(desde),
        hasta: finDelDia(hoyMx),
        etiqueta: `últimos ${dias + 1} días`,
      };
    }
    case "anio":
      return {
        desde: inicioDelDia(comoDia(anio, 1, 1)),
        hasta: finDelDia(hoyMx),
        etiqueta: String(anio),
      };
    case "mes_actual":
    default:
      return {
        desde: inicioDelDia(comoDia(anio, mes, 1)),
        hasta: finDelDia(hoyMx),
        etiqueta: `${MESES[mes - 1]} ${anio}`,
      };
  }
}

/** Rango a la medida, tolerando que llegue al revés. */
export function rangoPersonalizado(desdeIso: string, hastaIso: string): Rango | null {
  const valido = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!valido(desdeIso) || !valido(hastaIso)) return null;
  // Tolera que llegue al revés en lugar de devolver un rango vacío.
  const [a, b] = desdeIso <= hastaIso ? [desdeIso, hastaIso] : [hastaIso, desdeIso];
  return { desde: inicioDelDia(a), hasta: finDelDia(b), etiqueta: `${a} → ${b}` };
}

/**
 * El período anterior, del MISMO largo y pegado al inicio del actual.
 *
 * Para los meses se usa el mes calendario anterior en lugar de "los mismos N
 * días hacia atrás": comparar un febrero de 28 días contra 28 días de enero
 * confunde más de lo que aclara.
 */
export function periodoAnterior(rango: Rango, preset: Preset): Rango {
  if (preset === "mes_actual" || preset === "mes_pasado") {
    const { anio, mes } = partesMx(rango.desde);
    const anioPrevio = mes === 1 ? anio - 1 : anio;
    const mesPrevio = mes === 1 ? 12 : mes - 1;
    return {
      desde: inicioDelDia(comoDia(anioPrevio, mesPrevio, 1)),
      hasta: finDelDia(comoDia(anioPrevio, mesPrevio, diasDelMes(anioPrevio, mesPrevio))),
      etiqueta: `${MESES[mesPrevio - 1]} ${anioPrevio}`,
    };
  }

  const largo = rango.hasta.getTime() - rango.desde.getTime();
  const hasta = new Date(rango.desde.getTime() - 1);
  const desde = new Date(hasta.getTime() - largo);
  return { desde, hasta, etiqueta: "período anterior" };
}

/**
 * La variación entre dos números, en porcentaje.
 *
 * Devuelve null cuando no hay con qué comparar (antes era cero). Escribir
 * "+∞%" o "+100%" cuando se pasa de 0 a 5 es inventar una referencia que no
 * existe — la pantalla dice "sin comparación" y ya.
 */
export function variacion(actual: number, anterior: number): number | null {
  if (!Number.isFinite(actual) || !Number.isFinite(anterior)) return null;
  if (anterior === 0) return null;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}

/** Porcentaje seguro: nunca divide entre cero. */
export function porcentaje(parte: number, total: number): number {
  if (!total) return 0;
  return (parte / total) * 100;
}

/**
 * La mediana, no el promedio.
 *
 * Un caso olvidado tres días mueve el promedio y esconde que el resto se
 * contesta rápido. Por eso el tiempo de primera respuesta se mide así.
 */
export function mediana(valores: number[]): number | null {
  const limpios = valores.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (limpios.length === 0) return null;
  const medio = Math.floor(limpios.length / 2);
  return limpios.length % 2 === 1
    ? limpios[medio]
    : (limpios[medio - 1] + limpios[medio]) / 2;
}

/** Minutos a algo que una persona lea de un vistazo. */
export function duracionLegible(minutos: number | null): string {
  if (minutos === null) return "—";
  if (minutos < 1) return "menos de 1 min";
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const horas = minutos / 60;
  if (horas < 24) return `${horas.toFixed(1)} h`;
  return `${(horas / 24).toFixed(1)} días`;
}

/** Los días de un rango, en yyyy-mm-dd, para detectar huecos en el agregado. */
export function diasDelRango(rango: Rango): string[] {
  const dias: string[] = [];
  const fin = diaEnMexico(rango.hasta);
  let cursor = diaEnMexico(rango.desde);
  while (cursor <= fin && dias.length < 400) {
    dias.push(cursor);
    // Se avanza sobre el instante de mediodía para no tropezar con cambios de
    // horario: sumar 24 h a la medianoche puede caer en el mismo día.
    cursor = diaEnMexico(new Date(inicioDelDia(cursor).getTime() + 36 * 3600000));
  }
  return dias;
}
