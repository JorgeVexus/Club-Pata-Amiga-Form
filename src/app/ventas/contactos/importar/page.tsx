"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  confirmarImportacion,
  leerArchivo,
  previsualizar,
  type LecturaCsv,
} from "./actions";
import {
  CAMPOS_IMPORTABLES,
  type Analisis,
  type Mapeo,
  type ResultadoImportacion,
} from "@/lib/crm/import";
// El día de una fecha se lee en hora de México, no en la del navegador: cortar
// el ISO a 10 caracteres da el día UTC y corre las fechas de la tarde al
// siguiente.
import { diaEnMexico } from "@/lib/tableros/rango";

/** Nombre legible de cada etapa, para la vista previa del pipeline. */
const ETAPA_TEXTO: Record<string, string> = {
  nuevo_prospecto: "Nuevo prospecto",
  solicitud_llamada: "Solicitud de llamada",
  registro_iniciado: "Registro iniciado",
  carrito_abandonado: "Carrito abandonado",
  pago_procesado: "Pago procesado",
  miembro_activo: "Miembro activo",
  miembro_inactivo: "Miembro inactivo",
  perdido: "Perdido",
};

const VEREDICTO_TEXTO: Record<string, { label: string; clase: string }> = {
  nuevo: { label: "Contacto nuevo", clase: "bg-lime/25 text-ink-title" },
  se_une: { label: "Se une a uno existente", clase: "bg-teal/15 text-teal-deep" },
  posible_duplicado: {
    label: "Posible duplicado (revisar)",
    clase: "bg-orange/20 text-ink-title",
  },
  sin_identidad: {
    label: "Sin correo ni teléfono — se omite",
    clase: "bg-cream text-ink-tertiary",
  },
  repetido_en_archivo: {
    label: "Repetido dentro del archivo",
    clase: "bg-pink/15 text-pink",
  },
};

/**
 * Importador de CSV en tres pasos: leer y mapear → vista previa → escribir.
 *
 * La vista previa es obligatoria por diseño: dice cuántos contactos entran
 * nuevos, cuántos se unen a alguien que ya existe y cuántos hay que revisar,
 * ANTES de tocar la base. Reimportar el mismo archivo no duplica a nadie porque
 * la escritura pasa por las mismas reglas de identidad que los webhooks.
 */
export default function ImportarPage() {
  const [texto, setTexto] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [lectura, setLectura] = useState<LecturaCsv | null>(null);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [fuente, setFuente] = useState("lynsales");
  const [colocarEnPipeline, setColocarEnPipeline] = useState(true);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  /** Avance de la escritura por lotes: filas hechas de cuántas. */
  const [avance, setAvance] = useState<{ hechas: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const paso = resultado ? 4 : analisis ? 3 : lectura ? 2 : 1;

  const cargar = async (file: File) => {
    setError(null);
    setAnalisis(null);
    setResultado(null);
    const contenido = await file.text();
    setTexto(contenido);
    setNombreArchivo(file.name);
    startTransition(async () => {
      const res = await leerArchivo(contenido);
      if ("error" in res) {
        setError(res.error);
        setLectura(null);
        return;
      }
      setLectura(res.lectura);
      setMapeo(res.lectura.mapeo);
    });
  };

  const mapeados = Object.values(mapeo).filter(Boolean);
  const faltaIdentidad = !mapeados.includes("email") && !mapeados.includes("phone");

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/ventas/contactos"
          className="text-[13px] font-semibold text-ink-tertiary hover:text-teal"
        >
          ← Contactos
        </Link>
        <h1 className="font-display text-[24px] text-ink-title">Importar CSV</h1>
        <span className="rounded-full bg-cream px-3 py-1 text-[11.5px] font-bold text-ink-secondary">
          Paso {paso} de 4
        </span>
      </div>

      {error && (
        <p className="rounded-[12px] bg-error-bg px-4 py-3 text-[13px] font-semibold text-error-text">
          {error}
        </p>
      )}

      {/* 1. Archivo */}
      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <h2 className="text-[15px] font-bold text-ink-title">1. El archivo</h2>
        <p className="text-[12.5px] leading-snug text-ink-secondary">
          Exporta de LynSales (o de donde sea) el CSV de contactos. Se aceptan
          comas o punto y coma como separador, y la columna de etiquetas puede
          traerlas separadas por <code>;</code> o <code>,</code>.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) cargar(f);
          }}
          className="text-[13px]"
        />
        {nombreArchivo && (
          <span className="text-[12px] text-ink-tertiary">
            {nombreArchivo}
            {lectura ? ` · ${lectura.totalFilas} filas` : ""}
            {lectura?.recortado ? " (se importarán las primeras 5,000)" : ""}
          </span>
        )}
      </div>

      {/* 2. Mapeo */}
      {lectura && (
        <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <h2 className="text-[15px] font-bold text-ink-title">
            2. Qué es cada columna
          </h2>
          <div className="grid gap-2.5 md:grid-cols-2">
            {lectura.cabeceras.map((cab, i) => (
              <label key={i} className="flex items-center gap-2">
                <span
                  title={lectura.primeras.map((f) => f[i]).filter(Boolean).join(" · ")}
                  className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-body"
                >
                  {cab || `(columna ${i + 1})`}
                </span>
                <select
                  value={mapeo[String(i)] ?? ""}
                  onChange={(e) =>
                    setMapeo((m) => ({
                      ...m,
                      [String(i)]: e.target.value as Mapeo[string],
                    }))
                  }
                  className="h-[34px] w-[190px] flex-none rounded-[8px] border-[1.5px] border-border-input bg-white px-2 text-[12px] outline-none focus:border-teal"
                >
                  <option value="">— ignorar —</option>
                  {CAMPOS_IMPORTABLES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {faltaIdentidad && (
            <p className="rounded-[10px] bg-orange/10 px-3 py-2 text-[12.5px] font-semibold text-ink-title">
              Falta asignar el correo o el teléfono: sin una de las dos no hay
              forma de saber quién es quién.
            </p>
          )}
          <button
            type="button"
            disabled={pendiente || faltaIdentidad}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await previsualizar(texto, mapeo);
                if ("error" in res) setError(res.error);
                else setAnalisis(res.analisis);
              })
            }
            className="self-start rounded-full bg-teal px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
          >
            Ver qué va a pasar
          </button>
        </div>
      )}

      {/* 3. Vista previa */}
      {analisis && (
        <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <h2 className="text-[15px] font-bold text-ink-title">
            3. Vista previa ({analisis.total} filas) — todavía no se escribe nada
          </h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {(
              [
                "nuevo",
                "se_une",
                "posible_duplicado",
                "repetido_en_archivo",
                "sin_identidad",
              ] as const
            ).map((v) => (
              <div key={v} className="flex flex-col gap-0.5 rounded-[12px] bg-cream p-3">
                <span className="font-display text-[22px] text-ink-title">
                  {analisis.conteo[v]}
                </span>
                <span className="text-[10.5px] font-semibold leading-tight text-ink-secondary">
                  {VEREDICTO_TEXTO[v].label}
                </span>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="border-b border-border-divider text-left">
                  {["#", "Nombre", "Identidad", "Qué pasará"].map((h) => (
                    <th
                      key={h}
                      className="px-2 py-2 text-[10.5px] font-extrabold tracking-[.06em] text-ink-tertiary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analisis.muestra.map((m) => (
                  <tr key={m.fila} className="border-b border-border-divider last:border-0">
                    <td className="px-2 py-1.5 text-[11.5px] text-ink-tertiary">
                      {m.fila}
                    </td>
                    <td className="px-2 py-1.5 text-[12.5px] text-ink-body">
                      {m.nombre}
                    </td>
                    <td className="px-2 py-1.5 text-[12px] text-ink-tertiary">
                      {m.identidad}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${VEREDICTO_TEXTO[m.veredicto].clase}`}
                      >
                        {VEREDICTO_TEXTO[m.veredicto].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analisis.total > analisis.muestra.length && (
              <span className="mt-1 block text-[11.5px] text-ink-tertiary">
                Se muestran las primeras {analisis.muestra.length} filas.
              </span>
            )}
          </div>

          {/* Fechas de alta: lo que decide si el tablero cuenta el histórico
              en su mes o todo el día de la importación. */}
          {analisis.fechas.con > 0 && (
            <p className="rounded-[10px] bg-cream p-3 text-[12px] leading-relaxed text-ink-body">
              <strong>{analisis.fechas.con}</strong> filas traen su fecha de alta
              original y se va a respetar (de{" "}
              {diaEnMexico(new Date(analisis.fechas.desde!))} a{" "}
              {diaEnMexico(new Date(analisis.fechas.hasta!))}).
              {analisis.fechas.sin > 0 && (
                <>
                  {" "}
                  Las otras <strong>{analisis.fechas.sin}</strong> quedan con la
                  fecha de hoy.
                </>
              )}
            </p>
          )}

          <label className="flex items-start gap-2.5 rounded-[10px] border-[1.5px] border-border-input p-3">
            <input
              type="checkbox"
              checked={colocarEnPipeline}
              onChange={(e) => setColocarEnPipeline(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-teal"
            />
            <span className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-ink-title">
                Colocar en el pipeline según las etiquetas
              </span>
              <span className="text-[11.5px] leading-relaxed text-ink-tertiary">
                Crea la tarjeta de cada contacto en la etapa que le corresponde.
                Quien ya tenga tarjeta no recibe otra.
              </span>
              {colocarEnPipeline && analisis.porEtapa.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-1.5">
                  {analisis.porEtapa.map((e) => (
                    <span
                      key={e.etapa}
                      className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-ink-secondary"
                    >
                      {ETAPA_TEXTO[e.etapa] ?? e.etapa}: {e.cuantas}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
              FUENTE DE CONTACTO (para las filas que no la traigan)
            </span>
            <input
              value={fuente}
              onChange={(e) => setFuente(e.target.value)}
              className="h-[36px] w-[220px] rounded-[10px] border-[1.5px] border-border-input px-3 text-[13px] outline-none focus:border-teal"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  // Se escribe por lotes: una sola llamada con el histórico
                  // completo se pasa del tiempo límite de la acción.
                  const total: ResultadoImportacion = {
                    creados: 0,
                    unidos: 0,
                    omitidos: 0,
                    paraRevisar: 0,
                    etiquetasAplicadas: 0,
                    tarjetasCreadas: 0,
                    fechasRespetadas: 0,
                    errores: [],
                  };
                  let desde = 0;
                  for (;;) {
                    const res = await confirmarImportacion(
                      texto,
                      mapeo,
                      fuente,
                      { colocarEnPipeline },
                      desde,
                    );
                    if ("error" in res) {
                      setError(res.error ?? "No se pudo importar.");
                      // Lo ya escrito se muestra igual: es lo que hay en la base.
                      if (desde > 0) setResultado(total);
                      setAvance(null);
                      return;
                    }
                    total.creados += res.resultado.creados;
                    total.unidos += res.resultado.unidos;
                    total.omitidos += res.resultado.omitidos;
                    total.paraRevisar += res.resultado.paraRevisar;
                    total.etiquetasAplicadas += res.resultado.etiquetasAplicadas;
                    total.tarjetasCreadas += res.resultado.tarjetasCreadas;
                    total.fechasRespetadas += res.resultado.fechasRespetadas;
                    total.errores.push(...res.resultado.errores);
                    desde = res.siguiente;
                    setAvance({ hechas: desde, total: res.total });
                    if (res.termino) break;
                  }
                  setAvance(null);
                  setResultado(total);
                })
              }
              className="rounded-full bg-teal px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
            >
              {pendiente ? "Importando…" : "Importar de verdad"}
            </button>
            {avance && (
              <span className="text-[12px] font-semibold text-ink-secondary">
                {avance.hechas} de {avance.total} filas
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Resultado */}
      {resultado && (
        <div className="flex flex-col gap-2.5 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <h2 className="text-[15px] font-bold text-ink-title">4. Listo</h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {[
              ["Creados", resultado.creados],
              ["Unidos a existentes", resultado.unidos],
              ["Para revisar", resultado.paraRevisar],
              ["Omitidos (sin correo ni teléfono)", resultado.omitidos],
              ["Etiquetas aplicadas", resultado.etiquetasAplicadas],
              ["Tarjetas en el pipeline", resultado.tarjetasCreadas],
              ["Con su fecha original", resultado.fechasRespetadas],
            ].map(([label, n]) => (
              <div key={String(label)} className="flex flex-col rounded-[12px] bg-cream p-3">
                <span className="font-display text-[22px] text-ink-title">{n}</span>
                <span className="text-[10.5px] font-semibold text-ink-secondary">
                  {label}
                </span>
              </div>
            ))}
          </div>
          {resultado.errores.length > 0 && (
            <div className="flex flex-col gap-1 rounded-[10px] bg-error-bg p-3">
              <span className="text-[12px] font-bold text-error-text">
                {resultado.errores.length} fila(s) con problema:
              </span>
              {resultado.errores.slice(0, 10).map((e) => (
                <span key={e} className="text-[11.5px] text-error-text">
                  {e}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ventas/contactos"
              className="rounded-full bg-teal px-5 py-2.5 text-[13px] font-bold text-white hover:bg-teal-deep"
            >
              Ver contactos
            </Link>
            <Link
              href="/ventas/contactos/duplicados"
              className="rounded-full border-[1.5px] border-border-input bg-white px-5 py-2.5 text-[13px] font-bold text-teal-deep hover:border-teal"
            >
              Revisar posibles duplicados
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
