import type { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveContact,
  SinIdentidadPropiaError,
  type ContactType,
} from "@/lib/crm/contacts";
import { emitEvent } from "@/lib/crm/events";
import { nameKey, normalizeEmail, normalizePhone } from "@/lib/crm/normalize";

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
  ];

  cabeceras.forEach((cab, i) => {
    const c = norm(cab);
    const pista = PISTAS.find(([, alias]) => alias.some((a) => c === a || c.includes(a)));
    mapeo[String(i)] = pista ? pista[0] : "";
  });
  return mapeo;
}

export type FilaLeida = Partial<Record<CampoImportable, string>>;

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
    if (muestra.length < 25)
      muestra.push({
        fila: indice + 1,
        nombre,
        identidad: email ?? phone ?? "—",
        veredicto,
      });
  });

  return { total: filas.length, conteo, muestra };
}

export type ResultadoImportacion = {
  creados: number;
  unidos: number;
  omitidos: number;
  /** Solo traían un teléfono que ya es de otra persona: los revisa un humano. */
  paraRevisar: number;
  etiquetasAplicadas: number;
  errores: string[];
};

/** Escribe la importación usando la misma puerta que los webhooks. */
export async function importar(
  admin: Admin,
  filas: FilaLeida[],
  actorId: string,
  fuentePorOmision: string,
): Promise<ResultadoImportacion> {
  const res: ResultadoImportacion = {
    creados: 0,
    unidos: 0,
    omitidos: 0,
    paraRevisar: 0,
    etiquetasAplicadas: 0,
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

      const { contactId, created } = await resolveContact(admin, {
        identities: { email: f.email, phone: f.phone },
        firstName: f.first_name,
        lastName: f.last_name,
        city: f.city,
        state: f.state,
        source: f.source ?? fuentePorOmision,
        contactType: tipo,
        actorId,
        actorLabel: "Importación",
      });
      if (created) res.creados += 1;
      else res.unidos += 1;

      // Etiquetas: separadas por ; o , como las exporta GoHighLevel
      const nombres = (f.tags ?? "")
        .split(/[;,]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
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

      await emitEvent(admin, {
        contactId,
        kind: "importado",
        summary: `Importado desde CSV (fila ${indice + 1})`,
        actorId,
      });
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
