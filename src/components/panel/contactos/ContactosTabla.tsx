"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { accionesEnLote } from "@/app/ventas/contactos/actions";

export type FilaContacto = {
  id: string;
  nombre: string;
  tipo: string;
  correo: string | null;
  telefono: string | null;
  canales: string[];
  etiquetas: { id: string; name: string; color: string }[];
  propietario: string | null;
  fuente: string | null;
  ultimaActividad: string | null;
  dnd: string[];
  esMiembro: boolean;
};

const TIPO_CHIP: Record<string, string> = {
  miembro: "bg-lime/25 text-ink-title",
  embajador: "bg-teal/15 text-teal-deep",
  centro: "bg-orange/20 text-ink-title",
  lead: "bg-cream text-ink-secondary",
  otro: "bg-cream text-ink-tertiary",
};

const CANAL_ICONO: Record<string, string> = {
  email: "✉️",
  phone: "📞",
  instagram: "📸",
  messenger: "💬",
  whatsapp: "🟢",
  portal: "🐾",
};

function tiempoRelativo(iso: string | null) {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `hace ${Math.max(mins, 1)} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 30) return `hace ${dias} d`;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

/**
 * Tabla de contactos con selección y acciones en lote.
 *
 * Con 989 oportunidades y 366 conversaciones sin leer en LynSales, el lote no es
 * un adorno: es la única forma de ponerse al día.
 */
export function ContactosTabla({
  filas,
  etiquetas,
  equipo,
  puedeEditar,
}: {
  filas: FilaContacto[];
  etiquetas: { id: string; name: string }[];
  equipo: { id: string; nombre: string }[];
  puedeEditar: boolean;
}) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const todos = filas.length > 0 && seleccion.length === filas.length;
  const alternar = (id: string) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const aplicar = (accion: { tagId?: string; ownerId?: string | null }) =>
    startTransition(async () => {
      const res = await accionesEnLote(seleccion, accion);
      setAviso(
        "error" in res && res.error
          ? res.error
          : `Aplicado a ${"aplicados" in res ? res.aplicados : 0} contacto(s) ✓`,
      );
      setSeleccion([]);
      setTimeout(() => setAviso(null), 4000);
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de lote: aparece solo cuando hay selección */}
      {puedeEditar && seleccion.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] bg-teal-dark px-4 py-3">
          <span className="text-[12.5px] font-bold text-white">
            {seleccion.length} seleccionado{seleccion.length === 1 ? "" : "s"}
          </span>
          <select
            aria-label="Etiquetar en lote"
            defaultValue=""
            disabled={pendiente}
            onChange={(e) => {
              if (e.target.value) aplicar({ tagId: e.target.value });
              e.target.value = "";
            }}
            className="h-[34px] rounded-full border-0 bg-white/95 px-3 text-[12.5px] font-semibold text-ink-title"
          >
            <option value="">Etiquetar…</option>
            {etiquetas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Asignar propietario en lote"
            defaultValue=""
            disabled={pendiente}
            onChange={(e) => {
              if (e.target.value)
                aplicar({
                  ownerId: e.target.value === "nadie" ? null : e.target.value,
                });
              e.target.value = "";
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
          {aviso && (
            <span className="text-[12px] font-bold text-lime">{aviso}</span>
          )}
        </div>
      )}
      {aviso && seleccion.length === 0 && (
        <span className="text-[12.5px] font-bold text-success-text">{aviso}</span>
      )}

      {/* Escritorio: tabla */}
      <div className="hidden overflow-x-auto rounded-[16px] bg-white shadow-[0_2px_10px_rgba(30,83,80,.05)] md:block">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-border-divider text-left">
              {puedeEditar && (
                <th className="w-[44px] px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={todos}
                    onChange={() =>
                      setSeleccion(todos ? [] : filas.map((f) => f.id))
                    }
                  />
                </th>
              )}
              {["Contacto", "Tipo", "Contacto directo", "Etiquetas", "Propietario", "Actividad"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10.5px] font-extrabold tracking-[.06em] text-ink-tertiary"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr
                key={f.id}
                className="border-b border-border-divider last:border-0 hover:bg-cream/60"
              >
                {puedeEditar && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${f.nombre}`}
                      checked={seleccion.includes(f.id)}
                      onChange={() => alternar(f.id)}
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link
                    href={`/ventas/contactos/${f.id}`}
                    className="flex flex-col gap-0.5"
                  >
                    <span className="text-[13.5px] font-bold text-ink-title hover:text-teal">
                      {f.nombre}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-tertiary">
                      {f.canales.map((c) => (
                        <span key={c} title={c} aria-hidden>
                          {CANAL_ICONO[c] ?? "•"}
                        </span>
                      ))}
                      {f.fuente && <span>· {f.fuente}</span>}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TIPO_CHIP[f.tipo] ?? TIPO_CHIP.otro}`}
                  >
                    {f.tipo}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-col text-[12px] text-ink-body">
                    <span>{f.correo ?? "—"}</span>
                    <span className="text-ink-tertiary">{f.telefono ?? ""}</span>
                  </span>
                  {f.dnd.length > 0 && (
                    <span className="mt-1 inline-block rounded-full bg-pink/15 px-2 py-0.5 text-[10px] font-bold text-pink">
                      🚫 {f.dnd.join(", ")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {f.etiquetas.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-cream px-2 py-0.5 text-[10.5px] font-semibold text-ink-secondary"
                      >
                        {t.name}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-body">
                  {f.propietario ?? (
                    <span className="text-ink-tertiary">Sin asignar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary">
                  {tiempoRelativo(f.ultimaActividad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {filas.map((f) => (
          <div
            key={f.id}
            className="flex gap-2.5 rounded-[14px] bg-white p-3.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
          >
            {puedeEditar && (
              <input
                type="checkbox"
                aria-label={`Seleccionar ${f.nombre}`}
                checked={seleccion.includes(f.id)}
                onChange={() => alternar(f.id)}
                className="mt-1 size-[18px] flex-none"
              />
            )}
            <Link href={`/ventas/contactos/${f.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[14px] font-bold text-ink-title">
                  {f.nombre}
                </span>
                <span
                  className={`flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold ${TIPO_CHIP[f.tipo] ?? TIPO_CHIP.otro}`}
                >
                  {f.tipo}
                </span>
              </span>
              <span className="truncate text-[12px] text-ink-body">
                {f.correo ?? f.telefono ?? "sin correo ni teléfono"}
              </span>
              <span className="flex items-center gap-2 text-[11px] text-ink-tertiary">
                <span>
                  {f.canales.map((c) => CANAL_ICONO[c] ?? "•").join(" ")}
                </span>
                <span>{tiempoRelativo(f.ultimaActividad)}</span>
                {f.propietario && <span>· {f.propietario}</span>}
              </span>
              {f.etiquetas.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {f.etiquetas.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-cream px-2 py-0.5 text-[10.5px] font-semibold text-ink-secondary"
                    >
                      {t.name}
                    </span>
                  ))}
                </span>
              )}
            </Link>
          </div>
        ))}
      </div>

      {filas.length === 0 && (
        <p className="rounded-[16px] bg-white px-5 py-12 text-center text-[13.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          No hay contactos con esos filtros.
        </p>
      )}
    </div>
  );
}
