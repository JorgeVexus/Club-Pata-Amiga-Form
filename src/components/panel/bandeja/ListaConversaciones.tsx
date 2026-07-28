"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loteBandeja } from "@/app/ventas/conversaciones/actions";

export type FilaHilo = {
  id: string;
  canal: string;
  nombre: string;
  contactId: string | null;
  ultimo: string | null;
  ultimoTexto: string;
  sinLeer: number;
  destacado: boolean;
  necesitaAtencion: boolean;
  asignadoA: string | null;
  pospuestoHasta: string | null;
  iaPausada: boolean;
  cerrado: boolean;
};

export const CANAL_SELLO: Record<string, string> = {
  instagram: "📸",
  facebook: "💬",
  whatsapp: "🟢",
  email: "✉️",
  portal: "🐾",
  vet: "🩺",
};

function tiempoRelativo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 30) return `${dias} d`;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

/**
 * Lista de la bandeja con selección múltiple.
 *
 * Con 366 conversaciones sin leer en el sistema vivo, el lote no es un adorno:
 * "marcar leídas" en bloque es la única forma de ponerse al día. El contador de
 * sin leer es POR PERSONA.
 */
export function ListaConversaciones({
  filas,
  seleccionadaId,
  equipo,
  puedeEditar,
  querystring,
}: {
  filas: FilaHilo[];
  seleccionadaId: string | null;
  equipo: { id: string; nombre: string }[];
  puedeEditar: boolean;
  /** Filtros vigentes, para conservarlos al abrir un hilo. */
  querystring: string;
}) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const alternar = (id: string) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const aplicar = (accion: Parameters<typeof loteBandeja>[1]) =>
    startTransition(async () => {
      const res = await loteBandeja(seleccion, accion);
      setAviso(
        "error" in res && res.error
          ? res.error
          : `Aplicado a ${"aplicados" in res ? res.aplicados : 0} ✓`,
      );
      setSeleccion([]);
      setTimeout(() => setAviso(null), 4000);
    });

  const href = (id: string) => {
    const sp = new URLSearchParams(querystring);
    sp.set("conv", id);
    return `/ventas/conversaciones?${sp.toString()}`;
  };

  return (
    <div className="flex min-h-0 flex-col">
      {puedeEditar && seleccion.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border-divider bg-teal-dark px-3 py-2.5">
          <span className="text-[12px] font-bold text-white">
            {seleccion.length}
          </span>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => aplicar({ leer: true })}
            className="rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-bold text-ink-title"
          >
            Marcar leídas
          </button>
          <select
            aria-label="Asignar en lote"
            defaultValue=""
            disabled={pendiente}
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (v) aplicar({ asignar: v === "nadie" ? null : v });
            }}
            className="h-[26px] rounded-full border-0 bg-white/95 px-2 text-[11.5px] font-semibold text-ink-title"
          >
            <option value="">Asignar…</option>
            <option value="nadie">Sin asignar</option>
            {equipo.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => aplicar({ cerrar: true })}
            className="rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-bold text-ink-title"
          >
            Archivar
          </button>
          <button
            type="button"
            onClick={() => setSeleccion([])}
            className="text-[11px] font-semibold text-white/70 underline"
          >
            Limpiar
          </button>
        </div>
      )}
      {aviso && (
        <span className="border-b border-border-divider bg-cream px-3 py-1.5 text-[11.5px] font-bold text-success-text">
          {aviso}
        </span>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filas.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-ink-secondary">
            No hay conversaciones con esos filtros.
          </p>
        )}
        {filas.map((f) => (
          <div
            key={f.id}
            className={`flex items-start gap-2 border-b border-border-divider px-3 py-2.5 ${
              seleccionadaId === f.id ? "bg-teal/[.07]" : "hover:bg-cream/60"
            }`}
          >
            {puedeEditar && (
              <input
                type="checkbox"
                aria-label={`Seleccionar ${f.nombre}`}
                checked={seleccion.includes(f.id)}
                onChange={() => alternar(f.id)}
                className="mt-1 size-[15px] flex-none"
              />
            )}
            <Link href={href(f.id)} className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="flex-none text-[13px]">
                  {CANAL_SELLO[f.canal] ?? "•"}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[13px] ${
                    f.sinLeer > 0
                      ? "font-extrabold text-ink-title"
                      : "font-semibold text-ink-body"
                  }`}
                >
                  {f.necesitaAtencion && "❗ "}
                  {f.nombre}
                </span>
                <span className="flex-none text-[10.5px] text-ink-tertiary">
                  {tiempoRelativo(f.ultimo)}
                </span>
                {f.sinLeer > 0 && (
                  <span className="flex-none rounded-full bg-teal px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                    {f.sinLeer}
                  </span>
                )}
              </span>
              <span className="truncate text-[11.5px] text-ink-tertiary">
                {f.ultimoTexto || "—"}
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-[10px]">
                {f.destacado && <span title="Destacada">⭐</span>}
                {f.iaPausada && (
                  <span className="rounded-full bg-orange/15 px-1.5 py-0.5 font-bold text-orange">
                    IA en pausa
                  </span>
                )}
                {f.asignadoA && (
                  <span className="text-ink-tertiary">{f.asignadoA}</span>
                )}
                {f.pospuestoHasta && (
                  <span className="text-ink-tertiary">
                    💤 {tiempoRelativo(f.pospuestoHasta)}
                  </span>
                )}
                {f.cerrado && <span className="text-ink-tertiary">archivada</span>}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
