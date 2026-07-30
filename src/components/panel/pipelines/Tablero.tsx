"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  devolverAutomatico,
  loteOportunidades,
  masTarjetas,
  moverEtapa,
} from "@/app/ventas/pipelines/actions";

export type Etapa = {
  id: string;
  key: string;
  name: string;
  color: string;
  staleDays: number | null;
  esGanada: boolean;
  esPerdida: boolean;
};

export type Tarjeta = {
  id: string;
  stageKey: string;
  titulo: string;
  contactId: string;
  contacto: string;
  valorPesos: number;
  esEstimado: boolean;
  propietario: string | null;
  propietarioInicial: string | null;
  fijadaPor: string | null;
  estancada: boolean;
  diasEnEtapa: number;
  conversaciones: number;
  notas: number;
  tareas: number;
  motivoPerdida: string | null;
};

/**
 * Los totales REALES de una etapa, que no salen de las tarjetas cargadas.
 *
 * Cada columna abre con las primeras 50: sin esto el encabezado diría "50
 * oportunidades" donde hay 169, y el aviso de estancadas contaría solo las
 * visibles. Los números que decide el equipo tienen que ser los de la base.
 */
export type TotalEtapa = {
  cuantas: number;
  valorPesos: number;
  estancadas: number;
};

/** Los colores de etapa se guardan como llave del tema, no como clase. */
const PUNTO: Record<string, string> = {
  teal: "bg-teal",
  "teal-deep": "bg-teal-deep",
  orange: "bg-orange",
  pink: "bg-pink",
  lime: "bg-lime",
  "ink-title": "bg-ink-title",
  "ink-tertiary": "bg-ink-tertiary",
};

const pesos = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function Tablero({
  etapas,
  tarjetas,
  totales,
  soloMios,
  motivos,
  equipo,
  puedeEditar,
}: {
  etapas: Etapa[];
  tarjetas: Tarjeta[];
  totales: Record<string, TotalEtapa>;
  soloMios: boolean;
  motivos: { id: string; name: string }[];
  equipo: { id: string; nombre: string }[];
  puedeEditar: boolean;
}) {
  const [vista, setVista] = useState<"tablero" | "lista">("tablero");
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [colapsadas, setColapsadas] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pidiendoMotivo, setPidiendoMotivo] = useState<{
    ids: string[];
    stageKey: string;
  } | null>(null);
  const [pendiente, startTransition] = useTransition();
  const [movilEtapa, setMovilEtapa] = useState(etapas[0]?.key ?? "");

  const decir = (texto: string) => {
    setAviso(texto);
    setTimeout(() => setAviso(null), 4000);
  };

  /**
   * Las páginas extra que trajo "ver más", por llave de etapa. Se van al mover
   * una tarjeta (la pantalla se recarga) y eso está bien: después de un
   * movimiento lo importante es ver el tablero al día, no dónde iba uno leyendo.
   */
  const [extras, setExtras] = useState<Record<string, Tarjeta[]>>({});
  const [trayendo, setTrayendo] = useState<string | null>(null);

  const porEtapa = (key: string) => [
    ...tarjetas.filter((t) => t.stageKey === key),
    ...(extras[key] ?? []),
  ];
  const total = (key: string): TotalEtapa =>
    totales[key] ?? { cuantas: 0, valorPesos: 0, estancadas: 0 };

  const verMas = async (e: Etapa) => {
    setTrayendo(e.key);
    const res = await masTarjetas(e.id, porEtapa(e.key).length, soloMios);
    setTrayendo(null);
    if ("error" in res) {
      decir(res.error ?? "No se pudieron traer más tarjetas.");
      return;
    }
    setExtras((x) => ({ ...x, [e.key]: [...(x[e.key] ?? []), ...res.tarjetas] }));
  };

  /** Todas las tarjetas cargadas, sin importar la etapa (la usa la lista). */
  const todas = [...tarjetas, ...Object.values(extras).flat()];
  const faltantes = etapas.reduce(
    (s, e) => s + Math.max(0, total(e.key).cuantas - porEtapa(e.key).length),
    0,
  );

  /** La siguiente página de cada etapa que tenga pendientes, de un jalón. */
  const verMasTodas = async () => {
    const conPendientes = etapas.filter(
      (e) => total(e.key).cuantas > porEtapa(e.key).length,
    );
    setTrayendo("lista");
    const paginas = await Promise.all(
      conPendientes.map(async (e) => ({
        key: e.key,
        res: await masTarjetas(e.id, porEtapa(e.key).length, soloMios),
      })),
    );
    setTrayendo(null);
    setExtras((x) => {
      const siguiente = { ...x };
      for (const { key, res } of paginas)
        if ("tarjetas" in res && res.tarjetas)
          siguiente[key] = [...(siguiente[key] ?? []), ...res.tarjetas];
      return siguiente;
    });
  };

  const mover = (ids: string[], stageKey: string, lostReasonId?: string) => {
    const destino = etapas.find((e) => e.key === stageKey);
    // Perdido exige motivo: es el dato que hoy no tienen y el que dice qué
    // arreglar en el discurso de venta.
    if (destino?.esPerdida && !lostReasonId) {
      setPidiendoMotivo({ ids, stageKey });
      return;
    }
    startTransition(async () => {
      if (ids.length === 1) {
        const res = await moverEtapa(ids[0], stageKey as never, lostReasonId);
        decir("error" in res && res.error ? res.error : `Movida a ${destino?.name} ✓`);
      } else {
        const res = await loteOportunidades(ids, {
          stageKey: stageKey as never,
          lostReasonId,
        });
        decir(
          "error" in res && res.error
            ? res.error
            : `${"movidas" in res ? res.movidas : 0} movidas${"bloqueadas" in res && res.bloqueadas ? `, ${res.bloqueadas} sin cambio` : ""} ✓`,
        );
      }
      setSeleccion([]);
      setPidiendoMotivo(null);
    });
  };

  const alternar = (id: string) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const tarjeta = (t: Tarjeta) => {
    const etapa = etapas.find((e) => e.key === t.stageKey);
    return (
      <div
        key={t.id}
        draggable={puedeEditar}
        onDragStart={() => setArrastrando(t.id)}
        onDragEnd={() => {
          setArrastrando(null);
          setSobre(null);
        }}
        className={`flex flex-col gap-2 rounded-[12px] border-[1.5px] bg-white p-3 transition-shadow ${
          t.estancada ? "border-orange/70" : "border-transparent"
        } ${arrastrando === t.id ? "opacity-40" : ""} ${puedeEditar ? "cursor-grab" : ""} shadow-[0_1px_5px_rgba(30,83,80,.06)] hover:shadow-[0_4px_14px_rgba(30,83,80,.12)]`}
      >
        <div className="flex items-start gap-2">
          {puedeEditar && (
            <input
              type="checkbox"
              aria-label={`Seleccionar ${t.titulo}`}
              checked={seleccion.includes(t.id)}
              onChange={() => alternar(t.id)}
              className="mt-0.5 size-[15px] flex-none"
            />
          )}
          <Link
            href={`/ventas/contactos/${t.contactId}`}
            className="min-w-0 flex-1 text-[12.5px] font-bold leading-snug text-ink-title hover:text-teal"
          >
            {t.titulo}
          </Link>
          {t.propietarioInicial && (
            <span
              title={t.propietario ?? ""}
              className="grid size-[22px] flex-none place-items-center rounded-full bg-teal/15 text-[10px] font-extrabold text-teal-deep"
            >
              {t.propietarioInicial}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-ink-tertiary">Valor:</span>
          <span className="text-[12.5px] font-bold text-ink-title">
            {pesos(t.valorPesos)}
            {t.esEstimado && (
              <span className="ml-1 text-[9.5px] font-semibold text-ink-tertiary">
                est.
              </span>
            )}
          </span>
        </div>

        {/* Contadores rápidos: se leen de un vistazo, como en LynSales */}
        <div className="flex items-center gap-2.5 text-[10.5px] text-ink-tertiary">
          <span title="Conversaciones">💬 {t.conversaciones}</span>
          <span title="Notas">📝 {t.notas}</span>
          <span title="Tareas abiertas">☑️ {t.tareas}</span>
          <span title="Días en esta etapa" className={t.estancada ? "font-bold text-orange" : ""}>
            ⏱️ {t.diasEnEtapa}d
          </span>
        </div>

        {t.motivoPerdida && (
          <span className="rounded-full bg-pink/10 px-2 py-0.5 text-[10px] font-semibold text-pink">
            {t.motivoPerdida}
          </span>
        )}

        {t.fijadaPor && (
          <span className="flex items-center justify-between gap-1 rounded-[8px] bg-cream px-2 py-1 text-[10px] text-ink-secondary">
            <span>📌 Fijada por {t.fijadaPor}</span>
            {puedeEditar && (
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    await devolverAutomatico(t.id);
                    decir("Vuelve a moverse sola ✓");
                  })
                }
                className="font-bold text-teal underline"
              >
                soltar
              </button>
            )}
          </span>
        )}

        {/* Camino sin arrastrar: funciona en táctil y con teclado */}
        {puedeEditar && (
          <select
            aria-label={`Mover ${t.titulo} de etapa`}
            value={t.stageKey}
            disabled={pendiente}
            onChange={(e) => mover([t.id], e.target.value)}
            className="h-[28px] rounded-[8px] border-[1.5px] border-border-input bg-white px-1.5 text-[11px] text-ink-secondary outline-none focus:border-teal"
          >
            {etapas.map((e) => (
              <option key={e.key} value={e.key}>
                {e.key === t.stageKey ? `● ${e.name}` : `Mover a ${e.name}`}
              </option>
            ))}
          </select>
        )}
        {etapa?.esPerdida && !t.motivoPerdida && (
          <span className="text-[10px] text-ink-tertiary">Sin motivo registrado</span>
        )}
      </div>
    );
  };

  /**
   * "Ver más" al pie de la columna, solo si quedan tarjetas por traer. Dice
   * cuántas faltan para que nadie tenga que adivinar si ya vio todo.
   */
  const botonVerMas = (e: Etapa) => {
    const faltan = total(e.key).cuantas - porEtapa(e.key).length;
    if (faltan <= 0) return null;
    return (
      <button
        type="button"
        disabled={trayendo === e.key}
        onClick={() => verMas(e)}
        className="rounded-[10px] border-[1.5px] border-border-input bg-white px-3 py-2 text-[11.5px] font-bold text-teal-deep transition-colors hover:border-teal disabled:opacity-50"
      >
        {trayendo === e.key ? "Trayendo…" : `Ver más (${faltan})`}
      </button>
    );
  };

  const encabezado = (e: Etapa) => {
    const t = total(e.key);
    const n = t.cuantas;
    const cargadas = porEtapa(e.key).length;
    const colapsada = colapsadas.includes(e.key);
    return (
      <div className="flex items-center justify-between gap-2 border-b border-border-divider px-3 py-2.5">
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5">
            <span
              className={`size-[7px] flex-none rounded-full ${PUNTO[e.color] ?? "bg-teal"}`}
              aria-hidden
            />
            <span className="truncate text-[12.5px] font-bold text-ink-title">
              {e.name}
            </span>
          </span>
          <span className="text-[10.5px] text-ink-tertiary">
            {n} oportunidad{n === 1 ? "" : "es"} · {pesos(t.valorPesos)} MXN
            {cargadas < n && ` · mostrando ${cargadas}`}
          </span>
        </span>
        <button
          type="button"
          onClick={() =>
            setColapsadas((c) =>
              c.includes(e.key) ? c.filter((k) => k !== e.key) : [...c, e.key],
            )
          }
          aria-label={colapsada ? `Expandir ${e.name}` : `Colapsar ${e.name}`}
          className="flex-none text-[12px] text-ink-tertiary"
        >
          {colapsada ? "›" : "‹"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-[10px] bg-white p-1 shadow-[0_1px_5px_rgba(30,83,80,.06)]">
          {(["tablero", "lista"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              className={`rounded-[8px] px-3 py-1.5 text-[12px] font-bold capitalize transition-colors ${
                vista === v ? "bg-teal text-white" : "text-ink-secondary"
              }`}
            >
              {v === "tablero" ? "▦ Tablero" : "☰ Lista"}
            </button>
          ))}
        </div>
        {aviso && (
          <span className="text-[12.5px] font-bold text-success-text">{aviso}</span>
        )}
      </div>

      {/* Acciones en lote */}
      {puedeEditar && seleccion.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] bg-teal-dark px-4 py-3">
          <span className="text-[12.5px] font-bold text-white">
            {seleccion.length} tarjeta{seleccion.length === 1 ? "" : "s"}
          </span>
          <select
            aria-label="Mover en lote"
            defaultValue=""
            disabled={pendiente}
            onChange={(e) => {
              if (e.target.value) mover(seleccion, e.target.value);
              e.target.value = "";
            }}
            className="h-[34px] rounded-full border-0 bg-white/95 px-3 text-[12.5px] font-semibold text-ink-title"
          >
            <option value="">Mover a…</option>
            {etapas.map((e) => (
              <option key={e.key} value={e.key}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Asignar en lote"
            defaultValue=""
            disabled={pendiente}
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (!v) return;
              startTransition(async () => {
                const res = await loteOportunidades(seleccion, {
                  ownerId: v === "nadie" ? null : v,
                });
                decir("error" in res && res.error ? res.error : "Asignadas ✓");
                setSeleccion([]);
              });
            }}
            className="h-[34px] rounded-full border-0 bg-white/95 px-3 text-[12.5px] font-semibold text-ink-title"
          >
            <option value="">Asignar a…</option>
            <option value="nadie">Sin propietario</option>
            {equipo.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSeleccion([])}
            className="text-[12px] font-semibold text-white/70 underline"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Motivo de pérdida obligatorio */}
      {pidiendoMotivo && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] border-[1.5px] border-pink/50 bg-pink/5 px-4 py-3">
          <span className="text-[12.5px] font-bold text-ink-title">
            ¿Por qué se perdió?
          </span>
          {motivos.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={pendiente}
              onClick={() => mover(pidiendoMotivo.ids, pidiendoMotivo.stageKey, m.id)}
              className="rounded-full border-[1.5px] border-border-input bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-secondary hover:border-pink"
            >
              {m.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPidiendoMotivo(null)}
            className="text-[12px] font-semibold text-ink-tertiary underline"
          >
            Cancelar
          </button>
        </div>
      )}

      {vista === "tablero" ? (
        <>
          {/* Escritorio: columnas con arrastrar y soltar */}
          <div className="hidden gap-3 overflow-x-auto pb-2 md:flex">
            {etapas.map((e) => {
              const colapsada = colapsadas.includes(e.key);
              return (
                <div
                  key={e.key}
                  onDragOver={(ev) => {
                    if (!arrastrando) return;
                    ev.preventDefault();
                    setSobre(e.key);
                  }}
                  onDragLeave={() => setSobre((s) => (s === e.key ? null : s))}
                  onDrop={() => {
                    if (arrastrando) mover([arrastrando], e.key);
                    setArrastrando(null);
                    setSobre(null);
                  }}
                  className={`flex flex-none flex-col rounded-[14px] bg-cream/70 transition-colors ${
                    colapsada ? "w-[54px]" : "w-[260px]"
                  } ${sobre === e.key ? "ring-2 ring-teal" : ""}`}
                >
                  {colapsada ? (
                    <button
                      type="button"
                      onClick={() => setColapsadas((c) => c.filter((k) => k !== e.key))}
                      className="flex h-full flex-col items-center gap-2 py-3"
                      aria-label={`Expandir ${e.name}`}
                    >
                      <span className={`size-[7px] rounded-full ${PUNTO[e.color] ?? "bg-teal"}`} />
                      <span className="text-[11px] font-bold text-ink-secondary [writing-mode:vertical-rl]">
                        {e.name} ({porEtapa(e.key).length})
                      </span>
                    </button>
                  ) : (
                    <>
                      {encabezado(e)}
                      <div className="flex max-h-[calc(100dvh-320px)] flex-col gap-2 overflow-y-auto p-2">
                        {porEtapa(e.key).map(tarjeta)}
                        {porEtapa(e.key).length === 0 && (
                          <span className="px-2 py-6 text-center text-[11.5px] text-ink-tertiary">
                            Vacía
                          </span>
                        )}
                        {botonVerMas(e)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Móvil: una etapa a la vez con chips */}
          <div className="flex flex-col gap-2.5 md:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {etapas.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setMovilEtapa(e.key)}
                  className={`flex flex-none items-center gap-1.5 rounded-full px-3 py-2 text-[11.5px] font-bold ${
                    movilEtapa === e.key
                      ? "bg-teal text-white"
                      : "border-[1.5px] border-border-input bg-white text-ink-secondary"
                  }`}
                >
                  <span className={`size-[6px] rounded-full ${PUNTO[e.color] ?? "bg-teal"}`} />
                  {e.name} ({total(e.key).cuantas})
                </button>
              ))}
            </div>
            <div className="rounded-[14px] bg-cream/70 p-2">
              <span className="block px-1 pb-2 text-[11px] font-bold text-ink-tertiary">
                {pesos(total(movilEtapa).valorPesos)} MXN en esta etapa
              </span>
              <div className="flex flex-col gap-2">
                {porEtapa(movilEtapa).map(tarjeta)}
                {porEtapa(movilEtapa).length === 0 && (
                  <span className="px-2 py-6 text-center text-[12px] text-ink-tertiary">
                    Vacía
                  </span>
                )}
                {(() => {
                  const e = etapas.find((x) => x.key === movilEtapa);
                  return e ? botonVerMas(e) : null;
                })()}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Vista de lista, para trabajar en volumen */
        <div className="overflow-x-auto rounded-[16px] bg-white shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-border-divider text-left">
                {puedeEditar && <th className="w-[44px] px-4 py-3" />}
                {["Oportunidad", "Etapa", "Valor", "Propietario", "Días", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10.5px] font-extrabold tracking-[.06em] text-ink-tertiary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todas.map((t) => {
                const e = etapas.find((s) => s.key === t.stageKey);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border-divider last:border-0 hover:bg-cream/60"
                  >
                    {puedeEditar && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${t.titulo}`}
                          checked={seleccion.includes(t.id)}
                          onChange={() => alternar(t.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link
                        href={`/ventas/contactos/${t.contactId}`}
                        className="text-[13px] font-bold text-ink-title hover:text-teal"
                      >
                        {t.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[12px] text-ink-body">
                        <span className={`size-[6px] rounded-full ${PUNTO[e?.color ?? "teal"]}`} />
                        {e?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-bold text-ink-title">
                      {pesos(t.valorPesos)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-body">
                      {t.propietario ?? (
                        <span className="text-ink-tertiary">Sin asignar</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-[12px] ${t.estancada ? "font-bold text-orange" : "text-ink-tertiary"}`}
                    >
                      {t.diasEnEtapa}d
                    </td>
                    <td className="px-4 py-3">
                      {puedeEditar && (
                        <select
                          aria-label={`Mover ${t.titulo}`}
                          value={t.stageKey}
                          disabled={pendiente}
                          onChange={(ev) => mover([t.id], ev.target.value)}
                          className="h-[30px] rounded-[8px] border-[1.5px] border-border-input bg-white px-1.5 text-[11.5px] outline-none focus:border-teal"
                        >
                          {etapas.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {todas.length === 0 && (
            <p className="px-5 py-12 text-center text-[13.5px] text-ink-secondary">
              No hay oportunidades todavía.
            </p>
          )}
          {/* La lista es para trabajar en volumen, así que aquí "ver más" trae
              la siguiente página de TODAS las etapas que tengan pendientes. */}
          {faltantes > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-border-divider px-5 py-3">
              <span className="text-[11.5px] text-ink-tertiary">
                Mostrando {todas.length} de {todas.length + faltantes}
              </span>
              <button
                type="button"
                disabled={trayendo !== null}
                onClick={verMasTodas}
                className="rounded-full border-[1.5px] border-border-input bg-white px-4 py-2 text-[12px] font-bold text-teal-deep transition-colors hover:border-teal disabled:opacity-50"
              >
                {trayendo ? "Trayendo…" : `Ver más (${faltantes})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
