"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MiniBarChart } from "@/components/panel/MiniBarChart";
import { enviarReporteVentas, exportarEmbudo } from "@/app/ventas/actions";
import type { Preset } from "@/lib/tableros/rango";

export type TarjetaVista = {
  clave: string;
  etiqueta: string;
  texto: string;
  anteriorTexto: string | null;
  variacion: number | null;
  detalle?: string;
};

export type EtapaVista = {
  clave: string;
  nombre: string;
  cuantas: number;
  pesosTexto: string;
  pasoTexto: string | null;
  /** Ancho de la barra, 0–100. */
  proporcion: number;
};

export type PersonaVista = {
  userId: string;
  nombre: string;
  conversaciones: number;
  ganadas: number;
  perdidas: number;
  pesosTexto: string;
  tareasVencidas: number;
};

export type GraficaVista = {
  titulo: string;
  datos: { label: string; value: number }[];
  diasFaltantes: number;
};

const PRESETS: { valor: Preset; etiqueta: string }[] = [
  { valor: "mes_actual", etiqueta: "Mes en curso" },
  { valor: "mes_pasado", etiqueta: "Mes pasado" },
  { valor: "ultimos_30", etiqueta: "30 días" },
  { valor: "ultimos_90", etiqueta: "90 días" },
  { valor: "anio", etiqueta: "Año" },
];

/** La variación, con su signo y su color. Sin dato, se dice. */
function Variacion({ valor, anterior }: { valor: number | null; anterior: string | null }) {
  if (valor === null)
    return (
      <span className="text-[11px] text-ink-tertiary">
        {anterior === null ? "sin comparación" : `antes: ${anterior}`}
      </span>
    );
  const sube = valor >= 0;
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
          sube ? "bg-lime/40 text-ink-title" : "bg-orange/25 text-ink-title"
        }`}
      >
        {sube ? "▲" : "▼"} {Math.abs(valor).toFixed(0)}%
      </span>
      {anterior !== null && (
        <span className="text-[11px] text-ink-tertiary">antes: {anterior}</span>
      )}
    </span>
  );
}

export function Tablero({
  etiquetaPeriodo,
  etiquetaAnterior,
  preset,
  tarjetas,
  embudo,
  graficas,
  personas,
  motivos,
  soloMisNumeros,
  puedeReportar,
}: {
  etiquetaPeriodo: string;
  etiquetaAnterior: string;
  preset: Preset;
  tarjetas: TarjetaVista[];
  embudo: EtapaVista[];
  graficas: GraficaVista[];
  personas: PersonaVista[];
  motivos: { motivo: string; cuantas: number }[];
  /** True para el rol `ventas`: la tabla trae solo su renglón. */
  soloMisNumeros: boolean;
  /** Mandar el reporte por correo es del gerente para arriba. */
  puedeReportar: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const decir = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 8000);
  };

  /** Baja el CSV que armó el servidor, sin pasar el contenido por la URL. */
  const bajarCsv = () =>
    startTransition(async () => {
      const r = await exportarEmbudo({ periodo: preset });
      if ("error" in r) return decir(r.error ?? "No se pudo exportar.");
      const url = URL.createObjectURL(
        new Blob([r.csv], { type: "text/csv;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = r.nombre;
      a.click();
      URL.revokeObjectURL(url);
      decir(`${r.filas} fila(s) exportadas ✓`);
    });

  const cambiarPeriodo = (valor: Preset) => {
    const nuevo = new URLSearchParams(params.toString());
    nuevo.set("periodo", valor);
    router.push(`/ventas?${nuevo.toString()}`);
  };

  const sinDatos = tarjetas.every((t) => t.texto === "0" || t.texto === "$0" || t.texto === "0%");

  return (
    <div className="flex flex-col gap-5">
      {/* Período: manda sobre todo lo demás */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.valor}
            type="button"
            onClick={() => cambiarPeriodo(p.valor)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold ${
              preset === p.valor ? "bg-ink-title text-white" : "bg-white text-ink-secondary"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
        <span className="text-[11.5px] text-ink-secondary">
          {etiquetaPeriodo} · comparado contra {etiquetaAnterior}
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-2">
          {aviso && (
            <span className="text-[11.5px] font-bold text-success-text">{aviso}</span>
          )}
          <button
            type="button"
            disabled={pendiente}
            onClick={bajarCsv}
            className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-ink-secondary shadow-[0_1px_4px_rgba(30,83,80,.12)] disabled:opacity-50"
          >
            ⬇ Exportar embudo
          </button>
          {puedeReportar && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  const r = await enviarReporteVentas(preset);
                  decir(
                    "error" in r && r.error
                      ? r.error
                      : `Reporte enviado a ${r.destinatarios} destinatario(s) ✓`,
                  );
                })
              }
              className="rounded-full bg-teal px-4 py-1.5 text-[12px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              ✉️ Enviar reporte
            </button>
          )}
        </span>
      </div>

      {sinDatos && (
        <p className="rounded-[14px] bg-white px-5 py-6 text-center text-[12.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          Todavía no hay movimiento en este período. Los números aparecen solos
          conforme entren prospectos y conversaciones.
        </p>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
        {tarjetas.map((t) => (
          <div
            key={t.clave}
            className="flex flex-col gap-1 rounded-[14px] bg-white p-3.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
          >
            <span className="text-[9.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
              {t.etiqueta}
            </span>
            <span className="font-display text-[22px] leading-none text-ink-title">
              {t.texto}
            </span>
            <Variacion valor={t.variacion} anterior={t.anteriorTexto} />
            {t.detalle && (
              <span className="text-[11px] leading-snug text-ink-secondary">{t.detalle}</span>
            )}
          </div>
        ))}
      </div>

      {/* El embudo: la pieza principal */}
      <div className="flex flex-col gap-2 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <span className="text-[15px] font-bold text-ink-title">Embudo</span>
        <span className="text-[11.5px] text-ink-secondary">
          Cada etapa con cuántas oportunidades entraron en el período y su valor.
          El porcentaje es qué parte del total del período llegó ahí — la etapa
          más grande es donde se está quedando la gente.
        </span>
        <div className="flex flex-col gap-1.5 pt-1">
          {embudo.map((e) => (
            <a
              key={e.clave}
              href={`/ventas/pipelines?etapa=${e.clave}`}
              className="group flex flex-col gap-1 rounded-[10px] px-2 py-1.5 hover:bg-cream/70"
            >
              <span className="flex flex-wrap items-baseline gap-2">
                <span className="min-w-[150px] text-[12.5px] font-bold text-ink-title">
                  {e.nombre}
                </span>
                <span className="text-[13px] font-extrabold text-ink-title">{e.cuantas}</span>
                <span className="text-[11.5px] text-ink-secondary">{e.pesosTexto}</span>
                {e.pasoTexto && (
                  <span className="ml-auto text-[11px] font-semibold text-ink-tertiary">
                    {e.pasoTexto} del total
                  </span>
                )}
              </span>
              <span className="h-2 w-full overflow-hidden rounded-full bg-cream">
                <span
                  className="block h-full rounded-full bg-teal transition-all group-hover:bg-teal-deep"
                  style={{ width: `${Math.max(e.proporcion, e.cuantas > 0 ? 3 : 0)}%` }}
                />
              </span>
            </a>
          ))}
          {embudo.length === 0 && (
            <span className="text-[12px] text-ink-tertiary">
              No hay etapas configuradas todavía.
            </span>
          )}
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid gap-3 md:grid-cols-2">
        {graficas.map((g) => (
          <div
            key={g.titulo}
            className="flex flex-col gap-1 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]"
          >
            <MiniBarChart title={g.titulo} data={g.datos} />
            {g.diasFaltantes > 0 && (
              // Un hueco silencioso en una gráfica se lee como "no pasó nada".
              <span className="text-[11px] text-orange">
                Faltan {g.diasFaltantes} día(s) por calcular: la tarea nocturna
                todavía no los procesó.
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Por persona */}
      <div className="flex flex-col gap-2 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <span className="text-[15px] font-bold text-ink-title">
          {soloMisNumeros ? "Mis números" : "Por persona"}
        </span>
        {soloMisNumeros && (
          <span className="text-[11.5px] text-ink-secondary">
            Tu rol ve sus propios números. El embudo de arriba sí es el del equipo.
          </span>
        )}

        {/* En móvil se apila como lista; en escritorio es tabla */}
        <div className="hidden md:block">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-tertiary">
                <th className="py-1.5">Persona</th>
                <th>Conversaciones</th>
                <th>Ganadas</th>
                <th>Perdidas</th>
                <th>MXN ganados</th>
                <th>Tareas vencidas</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr key={p.userId} className="border-t border-border-divider/60">
                  <td className="py-1.5 font-semibold text-ink-title">{p.nombre}</td>
                  <td>{p.conversaciones}</td>
                  <td>{p.ganadas}</td>
                  <td>{p.perdidas}</td>
                  <td className="font-semibold">{p.pesosTexto}</td>
                  <td className={p.tareasVencidas > 0 ? "font-bold text-orange" : ""}>
                    {p.tareasVencidas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 md:hidden">
          {personas.map((p) => (
            <div key={p.userId} className="rounded-[10px] bg-cream/70 px-3 py-2">
              <span className="text-[12.5px] font-bold text-ink-title">{p.nombre}</span>
              <span className="block text-[11.5px] text-ink-secondary">
                {p.conversaciones} conversaciones · {p.ganadas} ganadas ·{" "}
                {p.perdidas} perdidas
              </span>
              <span className="block text-[11.5px] text-ink-body">
                {p.pesosTexto}
                {p.tareasVencidas > 0 && (
                  <span className="ml-2 font-bold text-orange">
                    {p.tareasVencidas} tarea(s) vencida(s)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {personas.length === 0 && (
          <span className="text-[12px] text-ink-tertiary">
            Nadie tiene oportunidades ni conversaciones asignadas en este período.
          </span>
        )}
      </div>

      {/* Motivos de pérdida */}
      <div className="flex flex-col gap-2 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <span className="text-[15px] font-bold text-ink-title">Por qué se pierden</span>
        <span className="text-[11.5px] text-ink-secondary">
          El dato que antes no existía: qué hay que arreglar en el discurso de venta.
        </span>
        {motivos.map((m) => (
          <span key={m.motivo} className="flex items-center gap-2 text-[12.5px]">
            <span className="min-w-[170px] text-ink-body">{m.motivo}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
              <span
                className="block h-full rounded-full bg-orange"
                style={{
                  width: `${(m.cuantas / Math.max(...motivos.map((x) => x.cuantas), 1)) * 100}%`,
                }}
              />
            </span>
            <span className="w-8 text-right font-bold text-ink-title">{m.cuantas}</span>
          </span>
        ))}
        {motivos.length === 0 && (
          <span className="text-[12px] text-ink-tertiary">
            Ninguna oportunidad perdida en el período.
          </span>
        )}
      </div>
    </div>
  );
}
