"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { tiempoRelativo } from "@/lib/dates";
import { useAhora, useValorLocal } from "@/lib/hooks";

export type BellEvent = {
  id: string;
  icon: string;
  text: string;
  href: string;
  created_at: string;
};

/**
 * Campana compartida por el panel y el portal de ventas: actividad reciente
 * (reintegros, apelaciones, solicitudes, leads, errores). El contador marca lo
 * ocurrido desde la última vez que esta persona la abrió (localStorage).
 *
 * `seenKey` separa el "visto" de cada portal: lo que ya revisé en ventas no
 * debe apagar el contador del panel.
 */
export function Bell({
  events,
  seenKey = "pa_admin_bell_seen",
}: {
  events: BellEvent[];
  seenKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const ahora = useAhora();

  // Lo guardado de antes (otra visita, otra pestaña) y lo que acabo de ver en
  // esta pantalla. Van por separado porque el evento `storage` no avisa de los
  // cambios de la propia pestaña.
  const vistoGuardado = useValorLocal(seenKey);
  const [vistoAhora, setVistoAhora] = useState<string | null>(null);
  const seenAt = vistoAhora ?? vistoGuardado;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unseen = seenAt
    ? events.filter((e) => e.created_at > seenAt).length
    : events.length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = new Date().toISOString();
      window.localStorage.setItem(seenKey, now);
      setVistoAhora(now);
    }
  };

  const timeAgo = (iso: string) => tiempoRelativo(iso, ahora);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Actividad reciente${unseen > 0 ? ` (${unseen} novedades)` : ""}`}
        className="relative grid size-[42px] place-items-center rounded-full bg-white text-[18px] shadow-[0_1px_6px_rgba(30,83,80,.06)] transition-colors hover:bg-cream-light"
      >
        🔔
        {unseen > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[19px] place-items-center rounded-full bg-pink px-1 text-[10.5px] font-extrabold text-white">
            {unseen}
          </span>
        )}
      </button>

      {/*
        En móvil la campana vive a la IZQUIERDA del encabezado, así que el
        panel anclado a la derecha se salía casi entero de la pantalla (en x
        negativa). Abajo de `sm` se fija a los bordes de la ventana, así queda
        completo sin importar dónde caiga la campana; de `sm` para arriba se
        comporta igual que antes. Misma solución que en NotificationsBell.
      */}
      {open && (
        <div className="absolute right-0 top-[50px] z-40 flex w-[340px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(30,83,80,.18)] max-sm:fixed max-sm:inset-x-4 max-sm:top-[60px] max-sm:w-auto">
          <span className="border-b border-border-divider px-4 py-3 text-[13px] font-bold text-ink-title">
            Actividad reciente
          </span>
          <div className="max-h-[360px] overflow-y-auto">
            {events.map((e) => (
              <Link
                key={e.id}
                href={e.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 border-b border-border-divider px-4 py-2.5 transition-colors last:border-0 hover:bg-cream"
              >
                <span className="text-[15px]" aria-hidden>
                  {e.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[12.5px] leading-snug text-ink-body">
                    {e.text}
                  </span>
                  <span className="text-[10.5px] text-ink-tertiary">
                    {timeAgo(e.created_at)}
                  </span>
                </span>
              </Link>
            ))}
            {events.length === 0 && (
              <span className="block px-4 py-6 text-center text-[13px] text-ink-secondary">
                Sin actividad reciente.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
