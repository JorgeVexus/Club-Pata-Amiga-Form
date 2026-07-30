"use client";

import { useState, useTransition } from "react";
import {
  aprobarEdicion,
  cambiarPlantilla,
  cancelarProgramada,
  confirmarRevisionVet,
  crearProgramacion,
  devolverEdicion,
  enviarPrueba,
  guardarEdicion,
  guardarPlantilla,
  guardarTema,
  investigarTema,
  layoutDeArranque,
  mandarARevision,
  programarEdicion,
  redactarEdicion,
  regenerarHuecos,
} from "@/app/ventas/newsletter/actions";
import { ETIQUETA_BLOQUE, type Bloque } from "@/lib/newsletter/bloques";
import type { MaterialInvestigado } from "@/lib/newsletter/agentes";

export type ProgramacionFila = {
  id: string;
  name: string;
  cadence: string;
  weekday: number | null;
  month_day: number | null;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
};

export type EdicionFila = {
  id: string;
  temaId: string;
  asunto: string | null;
  preencabezado: string | null;
  bloques: Bloque[];
  html: string | null;
  plantillaId: string | null;
  estado: string;
  esDeSalud: boolean;
  revisionVet: boolean;
  aprobada: boolean;
  notaDeRevision: string | null;
  pruebaEnviada: boolean;
  programadaPara: string | null;
  material: MaterialInvestigado | null;
  costoTexto: string;
  corridas: {
    tipo: string;
    modelo: string;
    costoTexto: string;
    error: string | null;
    cuando: string;
  }[];
};

export type TemaFila = {
  id: string;
  fecha: string;
  titulo: string;
  brief: string | null;
  incluir: string | null;
  evitar: string | null;
  fuentes: string[];
  esSalud: boolean;
  estado: string;
  edicion: EdicionFila | null;
};

export type PlantillaFila = {
  id: string;
  name: string;
  description: string | null;
  layout: string;
  sample: string | null;
  is_default: boolean;
};

const ESTADO_EDICION: Record<string, string> = {
  borrador: "bg-cream text-ink-secondary",
  investigada: "bg-orange/20 text-ink-title",
  redactada: "bg-orange/25 text-ink-title",
  revision: "bg-orange/35 text-ink-title",
  aprobada: "bg-lime/40 text-ink-title",
  programada: "bg-teal/20 text-ink-title",
  enviada: "bg-teal text-white",
  fallida: "bg-red-100 text-red-800",
};

const ET = "text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary";
const CAMPO =
  "h-[36px] rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[13px] outline-none focus:border-teal";
const AREA =
  "rounded-[10px] border-[1.5px] border-border-input bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-teal";

function dia(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paraInput(iso: string | null) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600 * 1000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function Newsletter({
  programaciones,
  temas,
  plantillas,
  suscriptoresActivos,
  hayCorreosDePrueba,
  topeEdicion,
  puedeRedactar,
  puedeAprobar,
  puedeProgramar,
  puedeRevisionVet,
  puedePlantillas,
}: {
  programaciones: ProgramacionFila[];
  temas: TemaFila[];
  plantillas: PlantillaFila[];
  suscriptoresActivos: number;
  hayCorreosDePrueba: boolean;
  topeEdicion: string;
  puedeRedactar: boolean;
  puedeAprobar: boolean;
  puedeProgramar: boolean;
  puedeRevisionVet: boolean;
  puedePlantillas: boolean;
}) {
  const [vista, setVista] = useState<"calendario" | "plantillas">("calendario");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const decir = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 10000);
  };

  const enRevision = temas.filter((t) => t.edicion?.estado === "revision");

  return (
    <div className="flex flex-col gap-4">
      {/* Cola del gerente, arriba, igual que en el calendario de contenido */}
      {enRevision.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[16px] border-[1.5px] border-orange/50 bg-orange/[.06] p-[18px]">
          <span className="text-[13.5px] font-bold text-ink-title">
            Requiere revisión ({enRevision.length})
          </span>
          {enRevision.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAbierto(t.id)}
              className="text-left text-[12.5px] text-ink-body underline decoration-dotted"
            >
              <strong>{t.titulo}</strong> · {dia(t.fecha)}
              {t.esSalud && !t.edicion?.revisionVet && (
                <span className="ml-1 font-bold text-orange">falta revisión veterinaria</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["calendario", "plantillas"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold ${
              vista === v ? "bg-ink-title text-white" : "bg-white text-ink-secondary"
            }`}
          >
            {v === "calendario" ? "Calendario editorial" : "Plantillas"}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2 text-[11.5px] text-ink-secondary">
          {aviso && <span className="font-bold text-success-text">{aviso}</span>}
          <span>{suscriptoresActivos} suscriptor(es) activo(s)</span>
        </span>
      </div>

      {!hayCorreosDePrueba && (
        <p className="rounded-[12px] bg-orange/10 px-3 py-2 text-[12px] text-ink-body">
          No hay <strong>correos de prueba</strong> configurados (Ajustes de IA).
          Sin ellos no se puede mandar la prueba, y sin prueba no se programa
          ningún envío.
        </p>
      )}

      {vista === "calendario" && (
        <>
          <Programaciones
            programaciones={programaciones}
            puedeProgramar={puedeProgramar}
            pendiente={pendiente}
            onAviso={decir}
            startTransition={startTransition}
          />

          <div className="flex flex-col gap-2">
            {temas.map((t) => (
              <TarjetaTema
                key={t.id}
                tema={t}
                plantillas={plantillas}
                abierto={abierto === t.id}
                onAbrir={() => setAbierto(abierto === t.id ? null : t.id)}
                topeEdicion={topeEdicion}
                hayCorreosDePrueba={hayCorreosDePrueba}
                puedeRedactar={puedeRedactar}
                puedeAprobar={puedeAprobar}
                puedeProgramar={puedeProgramar}
                puedeRevisionVet={puedeRevisionVet}
                pendiente={pendiente}
                onAviso={decir}
                startTransition={startTransition}
              />
            ))}
            {temas.length === 0 && (
              <p className="rounded-[14px] bg-white px-5 py-8 text-center text-[12.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
                No hay temas todavía. Crea una programación y se generan los
                huecos del año.
              </p>
            )}
          </div>
        </>
      )}

      {vista === "plantillas" && (
        <Plantillas
          plantillas={plantillas}
          puedePlantillas={puedePlantillas}
          pendiente={pendiente}
          onAviso={decir}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------ programaciones ---- */

function Programaciones({
  programaciones,
  puedeProgramar,
  pendiente,
  onAviso,
  startTransition,
}: {
  programaciones: ProgramacionFila[];
  puedeProgramar: boolean;
  pendiente: boolean;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("Boletín semanal");
  const [cadencia, setCadencia] = useState<"diaria" | "semanal" | "mensual">("semanal");
  const [diaSemana, setDiaSemana] = useState("3");
  const [diaMes, setDiaMes] = useState("1");
  const [inicia, setInicia] = useState(new Date().toISOString().slice(0, 10));
  const [termina, setTermina] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13.5px] font-bold text-ink-title">Programación</span>
        {puedeProgramar && (
          <button
            type="button"
            onClick={() => setCreando((v) => !v)}
            className="rounded-full bg-teal px-4 py-1.5 text-[12px] font-bold text-white hover:bg-teal-deep"
          >
            {creando ? "Cancelar" : "+ Programar el año"}
          </button>
        )}
      </div>

      {creando && (
        <div className="flex flex-wrap items-end gap-2.5 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <label className="flex flex-col gap-1">
            <span className={ET}>NOMBRE</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${CAMPO} w-[190px]`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ET}>CADENCIA</span>
            <select
              value={cadencia}
              onChange={(e) => setCadencia(e.target.value as typeof cadencia)}
              className={CAMPO}
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="diaria">Diaria</option>
            </select>
          </label>
          {cadencia === "semanal" && (
            <label className="flex flex-col gap-1">
              <span className={ET}>DÍA</span>
              <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className={CAMPO}>
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(
                  (d, i) => (
                    <option key={d} value={String(i + 1)}>
                      {d}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
          {cadencia === "mensual" && (
            <label className="flex flex-col gap-1">
              <span className={ET}>DÍA DEL MES (1–28)</span>
              <input
                type="number"
                min={1}
                max={28}
                value={diaMes}
                onChange={(e) => setDiaMes(e.target.value)}
                className={`${CAMPO} w-[130px]`}
              />
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className={ET}>DESDE</span>
            <input type="date" value={inicia} onChange={(e) => setInicia(e.target.value)} className={CAMPO} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ET}>HASTA (opcional)</span>
            <input type="date" value={termina} onChange={(e) => setTermina(e.target.value)} className={CAMPO} />
          </label>
          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              startTransition(async () => {
                const r = await crearProgramacion({
                  nombre,
                  cadencia,
                  diaSemana: Number(diaSemana),
                  diaMes: Number(diaMes),
                  inicia,
                  termina: termina || undefined,
                });
                if ("error" in r) onAviso(r.error ?? "No se pudo crear.");
                else {
                  onAviso(r.aviso);
                  setCreando(false);
                }
              })
            }
            className="rounded-full bg-teal px-5 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Crear y generar huecos
          </button>
        </div>
      )}

      {programaciones.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center gap-2 rounded-[12px] bg-white px-3.5 py-2.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
        >
          <span className="text-[12.5px] font-bold text-ink-title">{p.name}</span>
          <span className="text-[11.5px] text-ink-secondary">
            {p.cadence} · desde {dia(p.starts_on)}
            {p.ends_on ? ` hasta ${dia(p.ends_on)}` : ""}
          </span>
          {puedeProgramar && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  const r = await regenerarHuecos(p.id);
                  onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                })
              }
              className="ml-auto text-[11.5px] font-semibold text-ink-tertiary underline"
            >
              Generar huecos que falten
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- tema ----- */

function TarjetaTema({
  tema,
  plantillas,
  abierto,
  onAbrir,
  topeEdicion,
  hayCorreosDePrueba,
  puedeRedactar,
  puedeAprobar,
  puedeProgramar,
  puedeRevisionVet,
  pendiente,
  onAviso,
  startTransition,
}: {
  tema: TemaFila;
  plantillas: PlantillaFila[];
  abierto: boolean;
  onAbrir: () => void;
  topeEdicion: string;
  hayCorreosDePrueba: boolean;
  puedeRedactar: boolean;
  puedeAprobar: boolean;
  puedeProgramar: boolean;
  puedeRevisionVet: boolean;
  pendiente: boolean;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [titulo, setTitulo] = useState(tema.titulo);
  const [brief, setBrief] = useState(tema.brief ?? "");
  const [incluir, setIncluir] = useState(tema.incluir ?? "");
  const [evitar, setEvitar] = useState(tema.evitar ?? "");
  const [fuentes, setFuentes] = useState(tema.fuentes.join("\n"));
  const [esSalud, setEsSalud] = useState(tema.esSalud);
  const [ajuste, setAjuste] = useState("");
  const [comentario, setComentario] = useState("");
  const [cuando, setCuando] = useState(paraInput(tema.edicion?.programadaPara ?? null));

  const ed = tema.edicion;
  const sinBrief = brief.trim().length < 20;

  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-white p-3.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <button type="button" onClick={onAbrir} className="flex flex-wrap items-center gap-2 text-left">
        <span className="text-[11.5px] font-bold text-ink-tertiary">{dia(tema.fecha)}</span>
        <span className="text-[13.5px] font-bold text-ink-title">{tema.titulo}</span>
        {tema.esSalud && (
          <span className="rounded-full bg-orange/20 px-2 py-0.5 text-[10.5px] font-bold text-ink-title">
            salud
          </span>
        )}
        {ed && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              ESTADO_EDICION[ed.estado] ?? "bg-cream"
            }`}
          >
            {ed.estado}
          </span>
        )}
        {!ed && !tema.brief && (
          <span className="text-[11px] text-ink-tertiary">sin brief</span>
        )}
        {ed && <span className="ml-auto text-[11px] text-ink-tertiary">{ed.costoTexto}</span>}
      </button>

      {abierto && (
        <div className="flex flex-col gap-3 border-t border-border-input/50 pt-3">
          {/* --- el brief: la condición de arranque --- */}
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={ET}>TÍTULO</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={CAMPO} />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-[12.5px] text-ink-body">
              <input
                type="checkbox"
                checked={esSalud}
                onChange={(e) => setEsSalud(e.target.checked)}
                className="h-4 w-4 accent-teal"
              />
              Toca salud animal (pide revisión veterinaria)
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={ET}>BRIEF — el ángulo y qué debe quedar claro</span>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} className={AREA} />
            {sinBrief && (
              <span className="text-[11px] text-orange">
                Sin brief el agente no corre: es la dirección, no un trámite.
              </span>
            )}
          </label>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={ET}>DEBE INCLUIR</span>
              <textarea value={incluir} onChange={(e) => setIncluir(e.target.value)} rows={2} className={AREA} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={ET}>DEBE EVITAR</span>
              <textarea value={evitar} onChange={(e) => setEvitar(e.target.value)} rows={2} className={AREA} />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={ET}>FUENTES SUGERIDAS (una por línea)</span>
            <textarea value={fuentes} onChange={(e) => setFuentes(e.target.value)} rows={2} className={AREA} />
          </label>

          {puedeRedactar && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    const r = await guardarTema({
                      id: tema.id,
                      fecha: tema.fecha,
                      titulo,
                      brief,
                      incluir,
                      evitar,
                      fuentes,
                      esSalud,
                    });
                    onAviso("error" in r && r.error ? r.error : "Tema guardado ✓");
                  })
                }
                className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)] disabled:opacity-50"
              >
                Guardar tema
              </button>
              <button
                type="button"
                disabled={pendiente || sinBrief}
                title={sinBrief ? "Falta el brief" : undefined}
                onClick={() =>
                  startTransition(async () => {
                    const r = await investigarTema(tema.id);
                    onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                  })
                }
                className="rounded-full bg-orange px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
              >
                {ed?.material ? "Investigar de nuevo" : "Investigar"}
              </button>
              {ed?.material && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await redactarEdicion({ editionId: ed.id, ajuste });
                      onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                      setAjuste("");
                    })
                  }
                  className="rounded-full bg-teal px-4 py-1.5 text-[12px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
                >
                  {ed.bloques.length ? "Rehacer el correo" : "Armar el correo"}
                </button>
              )}
              <span className="self-center text-[11px] text-ink-tertiary">
                tope por edición: ${topeEdicion} MXN
              </span>
            </div>
          )}

          {ed?.material && puedeRedactar && (
            <label className="flex flex-col gap-1">
              <span className={ET}>AJUSTE PARA REHACER (opcional)</span>
              <input
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                placeholder="Ej.: más corto, tono más cálido, quita la promoción"
                className={CAMPO}
              />
            </label>
          )}

          {ed && (
            <Edicion
              ed={ed}
              plantillas={plantillas}
              comentario={comentario}
              setComentario={setComentario}
              cuando={cuando}
              setCuando={setCuando}
              hayCorreosDePrueba={hayCorreosDePrueba}
              puedeRedactar={puedeRedactar}
              puedeAprobar={puedeAprobar}
              puedeProgramar={puedeProgramar}
              puedeRevisionVet={puedeRevisionVet}
              pendiente={pendiente}
              onAviso={onAviso}
              startTransition={startTransition}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ edición ---- */

function Edicion({
  ed,
  plantillas,
  comentario,
  setComentario,
  cuando,
  setCuando,
  hayCorreosDePrueba,
  puedeRedactar,
  puedeAprobar,
  puedeProgramar,
  puedeRevisionVet,
  pendiente,
  onAviso,
  startTransition,
}: {
  ed: EdicionFila;
  plantillas: PlantillaFila[];
  comentario: string;
  setComentario: (s: string) => void;
  cuando: string;
  setCuando: (s: string) => void;
  hayCorreosDePrueba: boolean;
  puedeRedactar: boolean;
  puedeAprobar: boolean;
  puedeProgramar: boolean;
  puedeRevisionVet: boolean;
  pendiente: boolean;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [asunto, setAsunto] = useState(ed.asunto ?? "");
  const [preencabezado, setPreencabezado] = useState(ed.preencabezado ?? "");
  const [bloques, setBloques] = useState<Bloque[]>(ed.bloques);
  const [verHtml, setVerHtml] = useState(false);

  const sinFuente = (ed.material?.hallazgos ?? []).filter((h) => !h.verificado);
  const conFuente = (ed.material?.hallazgos ?? []).filter((h) => h.verificado);

  return (
    <div className="flex flex-col gap-3 rounded-[12px] bg-cream/70 p-3">
      {ed.notaDeRevision && (
        <p className="rounded-[10px] bg-orange/15 px-3 py-2 text-[12px] text-ink-body">
          <strong>Nota:</strong> {ed.notaDeRevision}
        </p>
      )}

      {/* --- hallazgos con sus fuentes --- */}
      {ed.material && (
        <div className="flex flex-col gap-1">
          <span className={ET}>HALLAZGOS DE LA INVESTIGACIÓN</span>
          {conFuente.map((h, i) => (
            <span key={`c${i}`} className="text-[12px] text-ink-body">
              ✓ {h.afirmacion}{" "}
              <a href={h.fuente ?? "#"} target="_blank" rel="noreferrer" className="text-[11px] underline">
                fuente
              </a>
            </span>
          ))}
          {sinFuente.map((h, i) => (
            <span key={`s${i}`} className="text-[12px] text-ink-tertiary line-through">
              {h.afirmacion}{" "}
              <span className="text-[11px] font-bold text-orange no-underline">
                sin fuente — no puede publicarse
              </span>
            </span>
          ))}
          {(ed.material.datosFaltantes ?? []).length > 0 && (
            <span className="text-[11.5px] text-ink-secondary">
              Faltantes declarados: {ed.material.datosFaltantes.join(" · ")}
            </span>
          )}
        </div>
      )}

      {/* --- el correo --- */}
      {ed.bloques.length > 0 && (
        <>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={ET}>ASUNTO ({asunto.length}/60)</span>
              <input value={asunto} onChange={(e) => setAsunto(e.target.value)} className={CAMPO} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={ET}>PREENCABEZADO ({preencabezado.length}/100)</span>
              <input
                value={preencabezado}
                onChange={(e) => setPreencabezado(e.target.value)}
                className={CAMPO}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className={ET}>BLOQUES</span>
            {bloques.map((b, i) => (
              <div key={i} className="flex flex-wrap items-start gap-2 rounded-[10px] bg-white px-3 py-2">
                <span className="min-w-[110px] text-[11px] font-bold text-ink-tertiary">
                  {ETIQUETA_BLOQUE[b.tipo] ?? b.tipo}
                </span>
                <textarea
                  value={"texto" in b ? (b.texto ?? "") : JSON.stringify(b)}
                  onChange={(e) => {
                    const copia = [...bloques];
                    copia[i] = { ...b, texto: e.target.value } as Bloque;
                    setBloques(copia);
                  }}
                  rows={2}
                  className="min-w-[200px] flex-1 rounded-[8px] border border-border-input px-2 py-1 text-[12px] outline-none focus:border-teal"
                />
                <button
                  type="button"
                  onClick={() => setBloques(bloques.filter((_, j) => j !== i))}
                  className="text-[11px] text-ink-tertiary underline"
                >
                  quitar
                </button>
              </div>
            ))}
          </div>

          {puedeRedactar && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    const r = await guardarEdicion({
                      editionId: ed.id,
                      asunto,
                      preencabezado,
                      bloques,
                    });
                    onAviso(
                      "error" in r && r.error
                        ? r.error
                        : ed.aprobada
                          ? "Guardado ✓ — como estaba aprobada, volvió a revisión"
                          : "Guardado ✓",
                    );
                  })
                }
                className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)] disabled:opacity-50"
              >
                Guardar cambios
              </button>

              {plantillas.length > 0 && (
                <select
                  value={ed.plantillaId ?? ""}
                  onChange={(e) =>
                    startTransition(async () => {
                      const r = await cambiarPlantilla(ed.id, e.target.value);
                      onAviso("error" in r && r.error ? r.error : "Plantilla cambiada ✓");
                    })
                  }
                  className={`${CAMPO} max-w-[220px]`}
                >
                  <option value="">Plantilla por omisión</option>
                  {plantillas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setVerHtml((v) => !v)}
                className="text-[11.5px] font-semibold text-teal underline"
              >
                {verHtml ? "Ocultar vista previa" : "Ver el correo"}
              </button>
            </div>
          )}

          {verHtml && ed.html && (
            <iframe
              title="Vista previa del boletín"
              srcDoc={ed.html.replace(/\{\{ENLACE_BAJA\}\}/g, "#")}
              className="h-[420px] w-full rounded-[12px] border border-border-input bg-white"
            />
          )}
        </>
      )}

      {/* --- las tres compuertas --- */}
      <div className="flex flex-col gap-2 rounded-[10px] bg-white p-3">
        <span className={ET}>ANTES DE PROGRAMAR</span>
        <span className="text-[12px] text-ink-body">
          {ed.aprobada ? "✓" : "○"} Aprobación de un gerente
        </span>
        <span className="text-[12px] text-ink-body">
          {ed.pruebaEnviada ? "✓" : "○"} Prueba enviada
        </span>
        <span className="text-[12px] text-ink-body">
          {!ed.esDeSalud ? "—" : ed.revisionVet ? "✓" : "○"} Revisión veterinaria
          {!ed.esDeSalud && " (no aplica: el tema no es de salud)"}
        </span>

        <div className="flex flex-wrap gap-2 pt-1">
          {puedeRedactar && ed.bloques.length > 0 && ed.estado !== "revision" && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  const r = await mandarARevision(ed.id);
                  onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                })
              }
              className="rounded-full bg-orange px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
            >
              Enviar a revisión
            </button>
          )}

          {puedeRedactar && ed.bloques.length > 0 && (
            <button
              type="button"
              disabled={pendiente || !hayCorreosDePrueba}
              onClick={() =>
                startTransition(async () => {
                  const r = await enviarPrueba(ed.id);
                  onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                })
              }
              className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)] disabled:opacity-40"
            >
              Enviar prueba
            </button>
          )}

          {puedeRevisionVet && ed.esDeSalud && !ed.revisionVet && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  const r = await confirmarRevisionVet(ed.id);
                  onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                })
              }
              className="rounded-full bg-lime px-4 py-1.5 text-[12px] font-bold text-ink-title disabled:opacity-50"
            >
              Confirmar revisión veterinaria
            </button>
          )}

          {puedeAprobar && ed.estado === "revision" && (
            <>
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    const r = await aprobarEdicion(ed.id);
                    onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                  })
                }
                className="rounded-full bg-teal px-4 py-1.5 text-[12px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
              >
                Aprobar
              </button>
              <input
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Qué cambiar (para devolver)"
                className={`${CAMPO} min-w-[180px] flex-1`}
              />
              <button
                type="button"
                disabled={pendiente || !comentario.trim()}
                onClick={() =>
                  startTransition(async () => {
                    const r = await devolverEdicion(ed.id, comentario);
                    onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                    setComentario("");
                  })
                }
                className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)] disabled:opacity-40"
              >
                Devolver
              </button>
            </>
          )}

          {puedeProgramar && ed.aprobada && ed.estado !== "enviada" && (
            <>
              <input
                type="datetime-local"
                value={cuando}
                onChange={(e) => setCuando(e.target.value)}
                className={CAMPO}
              />
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    const r = await programarEdicion(ed.id, cuando);
                    onAviso("error" in r && r.error ? r.error : (r.aviso ?? "Listo ✓"));
                  })
                }
                className="rounded-full bg-teal px-4 py-1.5 text-[12px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
              >
                {ed.estado === "programada" ? "Reprogramar" : "Programar envío"}
              </button>
              {ed.estado === "programada" && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    startTransition(async () => {
                      // Esta acción no tiene rama de error: siempre deja la
                      // edición aprobada y sin hora.
                      const r = await cancelarProgramada(ed.id);
                      onAviso(r.aviso);
                    })
                  }
                  className="text-[11.5px] font-semibold text-orange underline"
                >
                  Cancelar envío
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- historial de corridas con su costo --- */}
      {ed.corridas.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className={ET}>CORRIDAS · TOTAL {ed.costoTexto}</span>
          {ed.corridas.slice(0, 6).map((c, i) => (
            <span key={i} className="text-[11.5px] text-ink-secondary">
              {c.tipo} · {c.modelo} · {c.costoTexto}
              {c.error ? ` · falló: ${c.error}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- plantillas ---- */

function Plantillas({
  plantillas,
  puedePlantillas,
  pendiente,
  onAviso,
  startTransition,
}: {
  plantillas: PlantillaFila[];
  puedePlantillas: boolean;
  pendiente: boolean;
  onAviso: (t: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [layout, setLayout] = useState("");
  const [ejemplo, setEjemplo] = useState("");
  const [porOmision, setPorOmision] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] leading-snug text-ink-secondary">
        Las plantillas son <strong>datos, no código</strong>: así se le alimenta
        la marca al agente sin desplegar. El layout necesita{" "}
        <code className="rounded bg-cream px-1">{"{{bloques}}"}</code> donde va
        el contenido; opcionalmente{" "}
        <code className="rounded bg-cream px-1">{"{{preencabezado}}"}</code> y{" "}
        <code className="rounded bg-cream px-1">{"{{baja}}"}</code>. Si no pones
        el de baja, se agrega al final de todos modos.
      </p>

      {puedePlantillas && (
        <div className="flex flex-col gap-2 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="flex flex-col gap-1">
              <span className={ET}>NOMBRE</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${CAMPO} w-[210px]`} />
            </label>
            <label className="flex items-center gap-2 pb-2 text-[12.5px] text-ink-body">
              <input
                type="checkbox"
                checked={porOmision}
                onChange={(e) => setPorOmision(e.target.checked)}
                className="h-4 w-4 accent-teal"
              />
              Usar por omisión
            </label>
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  const r = await layoutDeArranque();
                  if ("layout" in r) {
                    setLayout(r.layout);
                    onAviso("Layout de arranque cargado — ajústalo a la marca ✓");
                  }
                })
              }
              className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)]"
            >
              Partir del layout de arranque
            </button>
          </div>
          <label className="flex flex-col gap-1">
            <span className={ET}>LAYOUT (HTML con {"{{bloques}}"})</span>
            <textarea
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              rows={7}
              className={`${AREA} font-mono text-[11.5px]`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={ET}>EJEMPLO DE REFERENCIA PARA EL AGENTE (opcional)</span>
            <textarea value={ejemplo} onChange={(e) => setEjemplo(e.target.value)} rows={3} className={AREA} />
          </label>
          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              startTransition(async () => {
                const r = await guardarPlantilla({ nombre, layout, ejemplo, porOmision });
                if ("error" in r) onAviso(r.error ?? "No se pudo guardar.");
                else {
                  onAviso("Plantilla guardada ✓");
                  setNombre("");
                  setLayout("");
                  setEjemplo("");
                }
              })
            }
            className="self-start rounded-full bg-teal px-5 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Guardar plantilla
          </button>
        </div>
      )}

      {plantillas.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center gap-2 rounded-[12px] bg-white px-3.5 py-2.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
        >
          <span className="text-[12.5px] font-bold text-ink-title">{p.name}</span>
          {p.is_default && (
            <span className="rounded-full bg-lime/40 px-2 py-0.5 text-[10.5px] font-bold text-ink-title">
              por omisión
            </span>
          )}
          {p.description && (
            <span className="text-[11.5px] text-ink-secondary">{p.description}</span>
          )}
        </div>
      ))}

      {plantillas.length === 0 && (
        <p className="rounded-[14px] bg-white px-5 py-8 text-center text-[12.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          No hay plantillas. Mientras tanto el boletín usa el layout de arranque.
        </p>
      )}
    </div>
  );
}
