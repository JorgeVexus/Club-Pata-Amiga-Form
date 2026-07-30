"use client";

import { useState, useTransition } from "react";
import {
  agregarNota,
  completarTarea,
  crearTarea,
} from "@/app/ventas/contactos/actions";
import { estaVencida } from "@/lib/dates";

export type TareaAbierta = {
  id: string;
  title: string;
  dueAt: string | null;
  responsable: string | null;
};

/**
 * Notas internas y tareas del contacto. Las notas caen en la misma línea de
 * tiempo que todo lo demás (son actividades de tipo `nota`), para que el
 * contexto no viva en otra pestaña.
 */
export function NotasYTareas({
  contactId,
  tareas,
  equipo,
  puedeEditar,
  ahora,
}: {
  contactId: string;
  tareas: TareaAbierta[];
  equipo: { id: string; nombre: string }[];
  puedeEditar: boolean;
  /**
   * Reloj del servidor, en milisegundos, para marcar tareas vencidas.
   *
   * Viene por prop a propósito: esta lista SÍ se pinta en el HTML del
   * servidor, así que si el navegador usara su propio `Date.now()` el
   * servidor y el cliente podrían no coincidir (desajuste de hidratación).
   * Con un solo reloj, que viaja en el HTML, las dos partes pintan igual.
   */
  ahora: number;
}) {
  const [nota, setNota] = useState("");
  const [titulo, setTitulo] = useState("");
  const [vence, setVence] = useState("");
  const [responsable, setResponsable] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const correr = (fn: () => Promise<{ error?: string } | { ok: true }>) =>
    startTransition(async () => {
      const res = await fn();
      setAviso("error" in res && res.error ? res.error : "Listo ✓");
      setTimeout(() => setAviso(null), 3500);
    });

  const vencida = (iso: string | null) => estaVencida(iso, ahora);

  return (
    <div className="flex flex-col gap-4 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold text-ink-title">Notas y tareas</h2>
        {aviso && (
          <span className="text-[11.5px] font-bold text-success-text">{aviso}</span>
        )}
      </div>

      {puedeEditar && (
        <div className="flex flex-col gap-2">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            placeholder="Nota interna — solo la ve el equipo"
            className="rounded-[10px] border-[1.5px] border-border-input px-3 py-2 text-[13px] text-ink-title outline-none focus:border-teal"
          />
          <button
            type="button"
            disabled={pendiente || !nota.trim()}
            onClick={() =>
              correr(async () => {
                const r = await agregarNota(contactId, nota);
                if (!("error" in r)) setNota("");
                return r;
              })
            }
            className="self-start rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
          >
            Guardar nota
          </button>
        </div>
      )}

      {/* Tareas abiertas: vencidas primero */}
      <div className="flex flex-col gap-2">
        <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
          PENDIENTES ({tareas.length})
        </span>
        {tareas.length === 0 && (
          <span className="text-[12.5px] text-ink-tertiary">
            Sin tareas abiertas.
          </span>
        )}
        {tareas.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 ${
              vencida(t.dueAt) ? "bg-pink/10" : "bg-cream"
            }`}
          >
            {puedeEditar && (
              <button
                type="button"
                disabled={pendiente}
                onClick={() => correr(() => completarTarea(t.id))}
                aria-label={`Completar ${t.title}`}
                className="grid size-[20px] flex-none place-items-center rounded-full border-[1.5px] border-teal text-[11px] text-teal hover:bg-teal hover:text-white"
              >
                ✓
              </button>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[12.5px] font-semibold text-ink-title">
                {t.title}
              </span>
              <span className="text-[11px] text-ink-tertiary">
                {t.dueAt
                  ? `${vencida(t.dueAt) ? "Venció" : "Vence"} ${new Intl.DateTimeFormat(
                      "es-MX",
                      { day: "numeric", month: "short" },
                    ).format(new Date(t.dueAt))}`
                  : "Sin fecha"}
                {t.responsable ? ` · ${t.responsable}` : ""}
              </span>
            </span>
          </div>
        ))}
      </div>

      {puedeEditar && (
        <div className="flex flex-col gap-2 border-t border-border-divider pt-3">
          <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
            NUEVA TAREA
          </span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Llamarle para cerrar la membresía…"
            className="h-[36px] rounded-[10px] border-[1.5px] border-border-input px-3 text-[13px] outline-none focus:border-teal"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={vence}
              onChange={(e) => setVence(e.target.value)}
              className="h-[36px] rounded-[10px] border-[1.5px] border-border-input px-2 text-[12.5px] outline-none focus:border-teal"
            />
            <select
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="h-[36px] rounded-[10px] border-[1.5px] border-border-input bg-white px-2 text-[12.5px] outline-none focus:border-teal"
            >
              <option value="">Para mí</option>
              {equipo.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pendiente || !titulo.trim()}
              onClick={() =>
                correr(async () => {
                  const r = await crearTarea(
                    contactId,
                    titulo,
                    vence ? new Date(`${vence}T12:00:00`).toISOString() : null,
                    responsable || null,
                  );
                  if (!("error" in r)) {
                    setTitulo("");
                    setVence("");
                  }
                  return r;
                })
              }
              className="rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
            >
              Crear tarea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
