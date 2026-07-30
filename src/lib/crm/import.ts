import type { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveContact,
  SinIdentidadPropiaError,
  type ContactType,
} from "@/lib/crm/contacts";
import { emitEvent } from "@/lib/crm/events";
import { nameKey, normalizeEmail, normalizePhone } from "@/lib/crm/normalize";
import { ensureOpportunity, type StageKey } from "@/lib/crm/opportunities";
import { diaEnMexico, instanteEnMexico } from "@/lib/zona-horaria";

type Admin = ReturnType<typeof createAdminClient>;

/** Columnas que el importador entiende. El resto se ignora. */
export const CAMPOS_IMPORTABLES = [
  { key: "first_name", label: "Nombre" },
  { key: "last_name", label: "Apellidos" },
  { key: "email", label: "Correo electrónico" },
  { key: "phone", label: "Teléfono" },
  { key: "tags", label: "Etiquetas (separadas por ; o ,)" },
  { key: "dnd", label: "No contactar (canales)" },
  { key: "source", label: "Fuente de contacto" },
  { key: "city", label: "Ciudad" },
  { key: "state", label: "Estado" },
  { key: "contact_type", label: "Tipo de contacto" },
  { key: "created_at", label: "Fecha de alta original" },
  { key: "last_activity_at", label: "Última actividad" },
] as const;

export type CampoImportable = (typeof CAMPOS_IMPORTABLES)[number]["key"];
/** Columna del CSV (por índice) → campo del CRM. */
export type Mapeo = Record<string, CampoImportable | "">;

export const MAX_FILAS = 5000;

/**
 * Lector de CSV sin dependencias: comillas dobles, comas dentro de comillas,
 * saltos de línea CRLF y BOM de Excel.
 */
export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let enComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (enComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else enComillas = false;
      } else campo += c;
      continue;
    }
    if (c === '"') {
      enComillas = true;
      continue;
    }
    if (c === "," || c === ";") {
      fila.push(campo);
      campo = "";
      continue;
    }
    if (c === "\r") continue;
    if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
      continue;
    }
    campo += c;
  }
  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((v) => v.trim() !== ""));
}

/** Adivina el mapeo por el nombre de la cabecera, para no empezar de cero. */
export function adivinarMapeo(cabeceras: string[]): Mapeo {
  const mapeo: Mapeo = {};
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();

  const PISTAS: [CampoImportable, string[]][] = [
    ["email", ["email", "correo", "e-mail", "mail"]],
    ["phone", ["phone", "telefono", "tel", "celular", "movil", "whatsapp"]],
    ["first_name", ["first name", "nombre", "first_name", "nombres"]],
    ["last_name", ["last name", "apellido", "apellidos", "last_name"]],
    ["tags", ["tags", "etiqueta", "etiquetas"]],
    ["dnd", ["dnd", "no contactar", "do not disturb"]],
    ["source", ["source", "fuente", "origen"]],
    ["city", ["city", "ciudad"]],
    ["state", ["state", "estado", "provincia"]],
    ["contact_type", ["type", "tipo"]],
    // Las de fecha van al final a propósito: "last activity" contiene "activity"
    // y nada más, pero si alguien agrega una pista corta arriba, que gane la suya.
    ["last_activity_at", ["last activity", "ultima actividad", "last_activity"]],
    ["created_at", ["created", "fecha de alta", "fecha de creacion", "creado", "alta"]],
  ];

  cabeceras.forEach((cab, i) => {
    const c = norm(cab);
    const pista = PISTAS.find(([, alias]) => alias.some((a) => c === a || c.includes(a)));
    mapeo[String(i)] = pista ? pista[0] : "";
  });
  return mapeo;
}

export type FilaLeida = Partial<Record<CampoImportable, string>>;

// ------------------------------------------------------- fechas del origen --

const MESES_EN: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Formato "Jul 28 2026 06:59 PM", que es como LynSales escribe Last Activity. */
const TEXTO_EN = /^([a-z]{3})\w* (\d{1,2}),? (\d{4})[, ]+(\d{1,2}):(\d{2})\s*([ap])m$/i;

/**
 * Una fecha del archivo como instante ISO, o null si no se entiende.
 *
 * Tres formatos, porque un export trae de todo:
 *  - ISO con zona ("2026-07-28T18:57:23-06:00") → se respeta tal cual;
 *  - texto en inglés sin zona ("Jul 28 2026 06:59 PM") → se lee como hora de
 *    México, que es donde opera el negocio y donde se capturó el dato;
 *  - fecha sola ("2026-07-28") → mediodía de México, para que no se corra de
 *    día por unas horas de diferencia.
 *
 * Lo que no se entiende devuelve null en lugar de una fecha inventada: el
 * contacto se crea con la de hoy, que es honesto, en vez de aterrizar en 1970
 * y arrastrar el eje de todas las gráficas.
 */
export function parseFecha(valor?: string | null): string | null {
  const texto = (valor ?? "").trim();
  if (!texto) return null;

  let fecha: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    fecha = instanteEnMexico(`${texto}T12:00:00`);
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(texto)) {
    // Con zona explícita se respeta; sin ella, es hora de México.
    fecha = /(Z|[+-]\d{2}:?\d{2})$/.test(texto)
      ? new Date(texto)
      : instanteEnMexico(texto);
  } else {
    const m = TEXTO_EN.exec(texto);
    if (m) {
      const mes = MESES_EN[m[1].toLowerCase()];
      let hora = Number(m[4]) % 12;
      if (m[6].toLowerCase() === "p") hora += 12;
      if (mes)
        fecha = instanteEnMexico(
          `${m[3]}-${String(mes).padStart(2, "0")}-${m[2].padStart(2, "0")}` +
            `T${String(hora).padStart(2, "0")}:${m[5]}:00`,
        );
    }
  }

  if (!fecha || Number.isNaN(fecha.getTime())) return null;
  // Red contra columnas mal mapeadas: una fecha absurda hace más daño que no
  // tenerla, porque nadie la ve hasta que el tablero sale raro.
  const anio = fecha.getUTCFullYear();
  if (anio < 2015 || fecha.getTime() > Date.now() + 86_400_000) return null;
  return fecha.toISOString();
}

// --------------------------------------------------- etiquetas → pipeline --

/**
 * Las etiquetas del CRM anterior, traducidas a etapas.
 *
 * Sale del export de LynSales (jul-2026): son las etiquetas que el equipo usa
 * de verdad, no un catálogo teórico. Lo que no esté aquí cae en "Nuevo
 * prospecto", que es lo único honesto: la etiqueta se conserva igual, así que
 * nada se pierde y el mapa se puede ampliar después.
 */
export const ETIQUETA_A_ETAPA: Record<string, StageKey> = {
  "carrito abandonado": "carrito_abandonado",
  funnel_registro_credenciales: "registro_iniciado",
  funnel_datos_contratante: "registro_iniciado",
  "solicitud por llamada": "solicitud_llamada",
  "seguimiento por llamada": "solicitud_llamada",
  "transferencia a humano": "solicitud_llamada",
  "miembro inactivo": "miembro_inactivo",
  "miembro activo": "miembro_activo",
  "pago procesado": "pago_procesado",
};

/**
 * Cuando hay varias etiquetas gana la que está más adelante en esta lista.
 *
 * No es la posición del pipeline: "solicitud de llamada" va arriba de las
 * etapas del embudo a propósito. Alguien que además pidió que le llamaran
 * necesita que una persona le llame, y esa tarjeta tiene que estar donde el
 * equipo la vea. En el archivo son 9 filas con etiquetas mezcladas, todas con
 * "solicitud por llamada" adentro.
 */
const AVANCE: StageKey[] = [
  "nuevo_prospecto",
  "registro_iniciado",
  "carrito_abandonado",
  "solicitud_llamada",
  "pago_procesado",
  "miembro_inactivo",
  "miembro_activo",
];

/** Nombres de etiqueta de una fila, normalizados como los guarda el CRM. */
export function etiquetasDe(fila: FilaLeida): string[] {
  return (fila.tags ?? "")
    .split(/[;,]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function etapaPorEtiquetas(nombres: string[]): StageKey {
  let etapa: StageKey = "nuevo_prospecto";
  for (const nombre of nombres) {
    const candidata = ETIQUETA_A_ETAPA[nombre];
    if (candidata && AVANCE.indexOf(candidata) > AVANCE.indexOf(etapa))
      etapa = candidata;
  }
  return etapa;
}

export function aplicarMapeo(filas: string[][], mapeo: Mapeo): FilaLeida[] {
  return filas.map((fila) => {
    const leida: FilaLeida = {};
    fila.forEach((valor, i) => {
      const campo = mapeo[String(i)];
      if (campo && valor.trim() !== "") leida[campo] = valor.trim();
    });
    return leida;
  });
}

export type Veredicto =
  | "nuevo"
  | "se_une"
  | "posible_duplicado"
  | "sin_identidad"
  | "repetido_en_archivo";

export type Analisis = {
  total: number;
  conteo: Record<Veredicto, number>;
  muestra: { fila: number; nombre: string; identidad: string; veredicto: Veredicto }[];
  /** Cuántas tarjetas caería en cada etapa, si se pide colocarlas. */
  porEtapa: { etapa: StageKey; cuantas: number }[];
  /** Fechas de alta que se van a respetar, y el rango que cubren. */
  fechas: { con: number; sin: number; desde: string | null; hasta: string | null };
};

/**
 * Vista previa SIN escribir nada.
 *
 * Aplica las mismas reglas que `resolveContact` en modo lectura: identidad
 * fuerte une, teléfono solo une si el nombre coincide. No se comparte la función
 * porque esa escribe; para que no se separen, las dos usan los mismos
 * normalizadores y la misma noción de identidad fuerte.
 */
export async function analizar(
  admin: Admin,
  filas: FilaLeida[],
): Promise<Analisis> {
  const conteo: Record<Veredicto, number> = {
    nuevo: 0,
    se_une: 0,
    posible_duplicado: 0,
    sin_identidad: 0,
    repetido_en_archivo: 0,
  };
  const muestra: Analisis["muestra"] = [];
  const vistosEnArchivo = new Set<string>();
  const porEtapa = new Map<StageKey, number>();
  const fechas: Analisis["fechas"] = { con: 0, sin: 0, desde: null, hasta: null };

  // Un solo viaje a la base con todos los valores del archivo
  const valores = new Set<string>();
  for (const f of filas) {
    const email = normalizeEmail(f.email);
    const phone = normalizePhone(f.phone);
    if (email) valores.add(email);
    if (phone) valores.add(phone);
  }

  const existentes = new Map<string, { contactId: string; kind: string }>();
  if (valores.size > 0) {
    const lista = [...valores];
    for (let i = 0; i < lista.length; i += 300) {
      const { data } = await admin
        .from("contact_identities")
        .select("contact_id, kind, value")
        .in("value", lista.slice(i, i + 300));
      for (const row of data ?? [])
        existentes.set(row.value, { contactId: row.contact_id, kind: row.kind });
    }
  }

  // Nombres de los contactos que coinciden por teléfono, para la regla débil
  const idsPorTelefono = [
    ...new Set(
      [...existentes.entries()]
        .filter(([, v]) => v.kind === "phone")
        .map(([, v]) => v.contactId),
    ),
  ];
  const nombrePorContacto = new Map<string, string>();
  if (idsPorTelefono.length > 0) {
    const { data } = await admin
      .from("contacts")
      .select("id, first_name, last_name")
      .in("id", idsPorTelefono);
    for (const c of data ?? [])
      nombrePorContacto.set(c.id, nameKey(c.first_name, c.last_name));
  }

  filas.forEach((f, indice) => {
    const email = normalizeEmail(f.email);
    const phone = normalizePhone(f.phone);
    const nombre = [f.first_name, f.last_name].filter(Boolean).join(" ") || "—";

    let veredicto: Veredicto;
    if (!email && !phone) veredicto = "sin_identidad";
    else {
      const claveArchivo = email ?? phone!;
      if (vistosEnArchivo.has(claveArchivo)) veredicto = "repetido_en_archivo";
      else {
        vistosEnArchivo.add(claveArchivo);
        const porCorreo = email ? existentes.get(email) : undefined;
        if (porCorreo) veredicto = "se_une";
        else {
          const porTelefono = phone ? existentes.get(phone) : undefined;
          if (!porTelefono) veredicto = "nuevo";
          else {
            const clave = nameKey(f.first_name, f.last_name);
            veredicto =
              clave && nombrePorContacto.get(porTelefono.contactId) === clave
                ? "se_une"
                : "posible_duplicado";
          }
        }
      }
    }

    conteo[veredicto] += 1;

    // Las etapas y las fechas solo cuentan para las filas que sí se escriben.
    if (veredicto !== "sin_identidad" && veredicto !== "repetido_en_archivo") {
      const etapa = etapaPorEtiquetas(etiquetasDe(f));
      porEtapa.set(etapa, (porEtapa.get(etapa) ?? 0) + 1);
      const creada = parseFecha(f.created_at);
      if (creada) {
        fechas.con += 1;
        if (!fechas.desde || creada < fechas.desde) fechas.desde = creada;
        if (!fechas.hasta || creada > fechas.hasta) fechas.hasta = creada;
      } else fechas.sin += 1;
    }

    if (muestra.length < 25)
      muestra.push({
        fila: indice + 1,
        nombre,
        identidad: email ?? phone ?? "—",
        veredicto,
      });
  });

  return {
    total: filas.length,
    conteo,
    muestra,
    porEtapa: AVANCE.filter((e) => porEtapa.has(e)).map((etapa) => ({
      etapa,
      cuantas: porEtapa.get(etapa)!,
    })),
    fechas,
  };
}

export type ResultadoImportacion = {
  creados: number;
  unidos: number;
  omitidos: number;
  /** Solo traían un teléfono que ya es de otra persona: los revisa un humano. */
  paraRevisar: number;
  etiquetasAplicadas: number;
  tarjetasCreadas: number;
  /** Filas que traían fecha de alta y se respetó. */
  fechasRespetadas: number;
  errores: string[];
};

export type OpcionesImportacion = {
  /**
   * Crear la tarjeta del pipeline según las etiquetas. Es opcional porque
   * importar contactos y llenar el tablero de ventas son dos decisiones
   * distintas: una lista de correos para el boletín no debería aparecer como
   * 400 oportunidades abiertas.
   */
  colocarEnPipeline?: boolean;
};

/** Escribe la importación usando la misma puerta que los webhooks. */
export async function importar(
  admin: Admin,
  filas: FilaLeida[],
  actorId: string,
  fuentePorOmision: string,
  opciones: OpcionesImportacion = {},
): Promise<ResultadoImportacion> {
  const res: ResultadoImportacion = {
    creados: 0,
    unidos: 0,
    omitidos: 0,
    paraRevisar: 0,
    etiquetasAplicadas: 0,
    tarjetasCreadas: 0,
    fechasRespetadas: 0,
    errores: [],
  };

  // Catálogo de etiquetas: se crean las que falten, una sola vez
  const { data: tagsCat } = await admin.from("tags").select("id, name");
  const tagPorNombre = new Map(
    (tagsCat ?? []).map((t) => [t.name.toLowerCase(), t.id]),
  );

  for (const [indice, f] of filas.entries()) {
    try {
      if (!normalizeEmail(f.email) && !normalizePhone(f.phone)) {
        res.omitidos += 1;
        continue;
      }

      const tipo = (
        ["lead", "miembro", "embajador", "centro", "otro"] as const
      ).includes(f.contact_type as ContactType)
        ? (f.contact_type as ContactType)
        : "lead";

      // La fecha del CRM anterior manda sobre "ahora". Si la fila no la trae
      // (o no se entiende), `resolveContact` usa el default de la base.
      const creadaEn = parseFecha(f.created_at);
      const actividadEn = parseFecha(f.last_activity_at) ?? creadaEn;

      const { contactId, created } = await resolveContact(admin, {
        identities: { email: f.email, phone: f.phone },
        firstName: f.first_name,
        lastName: f.last_name,
        city: f.city,
        state: f.state,
        source: f.source ?? fuentePorOmision,
        contactType: tipo,
        createdAt: creadaEn,
        lastActivityAt: actividadEn,
        actorId,
        actorLabel: "Importación",
      });
      if (created) {
        res.creados += 1;
        if (creadaEn) res.fechasRespetadas += 1;
      } else res.unidos += 1;

      // Etiquetas: separadas por ; o , como las exporta GoHighLevel
      const nombres = etiquetasDe(f);
      for (const nombre of nombres) {
        let tagId = tagPorNombre.get(nombre);
        if (!tagId) {
          const { data: creada } = await admin
            .from("tags")
            .upsert({ name: nombre }, { onConflict: "name" })
            .select("id")
            .single();
          if (!creada) continue;
          tagId = creada.id;
          tagPorNombre.set(nombre, tagId);
        }
        await admin
          .from("contact_tags")
          .upsert(
            { contact_id: contactId, tag_id: tagId, added_by: actorId },
            { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
          );
        res.etiquetasAplicadas += 1;
      }

      // "No contactar": se respeta desde la primera importación, no después.
      if (f.dnd) {
        const canales = f.dnd
          .toLowerCase()
          .split(/[;,\s]+/)
          .map((c) =>
            c.startsWith("mail") || c.startsWith("correo") || c === "email"
              ? "email"
              : c,
          )
          .filter((c) => ["email", "whatsapp", "sms", "llamada", "todos"].includes(c));
        const dnd: Record<string, boolean> = {};
        for (const c of canales) dnd[c] = true;
        if (Object.keys(dnd).length === 0 && /^(1|si|sí|true|yes|x)$/.test(f.dnd.trim().toLowerCase()))
          dnd.todos = true;
        if (Object.keys(dnd).length > 0)
          await admin.from("contacts").update({ dnd }).eq("id", contactId);
      }

      // La tarjeta nace con la fecha del contacto, no con la de hoy: el embudo
      // del tablero cuenta `opportunities.created_at`.
      if (opciones.colocarEnPipeline) {
        const { created: tarjetaNueva } = await ensureOpportunity(admin, {
          contactId,
          stageKey: etapaPorEtiquetas(nombres),
          source: f.source ?? fuentePorOmision,
          createdAt: creadaEn,
          actorId,
          actorLabel: "Importación",
        });
        if (tarjetaNueva) res.tarjetasCreadas += 1;
      }

      await emitEvent(admin, {
        contactId,
        kind: "importado",
        summary: creadaEn
          ? // El día se saca en hora de México: un alta de las 7 de la noche
            // en ISO (UTC) ya es del día siguiente, y la línea de tiempo diría
            // una fecha que no coincide con el archivo.
            `Importado desde CSV (fila ${indice + 1}) · alta original ${diaEnMexico(new Date(creadaEn))}`
          : `Importado desde CSV (fila ${indice + 1})`,
        actorId,
      });

      // Hasta el final, y solo si el archivo la trae: `emitEvent` sube
      // `last_activity_at` a "ahora" en cada evento —correcto para lo que pasa
      // en vivo, pero aquí borraría el dato que le da sentido a la lista
      // ordenada por última actividad. Alguien que no contesta desde marzo
      // tiene que verse así, no como si acabara de escribir.
      if (actividadEn)
        await admin
          .from("contacts")
          .update({ last_activity_at: actividadEn })
          .eq("id", contactId);
    } catch (err) {
      // Un teléfono que ya es de otra persona no es un error del archivo: es una
      // decisión que le toca a un humano en "Posibles duplicados".
      if (err instanceof SinIdentidadPropiaError) {
        res.paraRevisar += 1;
        await emitEvent(admin, {
          contactId: err.otroContacto,
          kind: "contacto_creado",
          summary: `Una fila del CSV (${[f.first_name, f.last_name].filter(Boolean).join(" ") || "sin nombre"}) trae este mismo teléfono — revisar si es la misma persona`,
          payload: { fila: indice + 1, importado: false },
          actorId,
        });
        continue;
      }
      res.errores.push(
        `Fila ${indice + 1}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return res;
}
