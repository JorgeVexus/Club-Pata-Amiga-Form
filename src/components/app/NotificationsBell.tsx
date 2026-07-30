"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { tiempoRelativo } from "@/lib/dates";
import { useAhora } from "@/lib/hooks";

export type NotificationItem = {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
};

/**
 * Campana de notificaciones del miembro (aprobaciones de mascota,
 * resoluciones de reintegro, etc. — tabla notifications, RLS propia).
 * Al abrir el panel se marcan como leídas.
 */
export function NotificationsBell({
  initial,
}: {
  initial: NotificationItem[];
}) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const ahora = useAhora();
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      // Optimista: marca todo como leído al abrir
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
    }
  };

  const timeAgo = (iso: string) => tiempoRelativo(iso, ahora);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
        className="relative grid size-11 place-items-center rounded-full bg-white text-[19px] shadow-[0_2px_10px_rgba(30,83,80,.08)] transition-colors hover:bg-cream-light"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[19px] place-items-center rounded-full bg-pink px-1 text-[10.5px] font-extrabold text-white">
            {unread}
          </span>
        )}
      </button>

      {/*
        En móvil el panel de 320px anclado a la derecha se salía unos pixeles
        por la izquierda de la pantalla. Abajo de `sm` se fija a los bordes de
        la ventana (así queda completo sin importar dónde caiga la campana); de
        `sm` para arriba se comporta igual que antes.
      */}
      {open && (
        <div className="absolute right-0 top-[52px] z-40 flex w-[320px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(30,83,80,.18)] max-sm:fixed max-sm:inset-x-4 max-sm:top-[62px] max-sm:w-auto">
          <span className="border-b border-border-divider px-4 py-3 text-[13px] font-bold text-ink-title">
            Notificaciones
          </span>
          <div className="max-h-[340px] overflow-y-auto">
            {items.length > 0 ? (
              items.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col gap-0.5 border-b border-border-divider px-4 py-3 last:border-0"
                >
                  <span className="text-[13px] font-semibold text-ink-title">
                    {n.title}
                  </span>
                  {n.message && (
                    <span className="text-xs leading-snug text-ink-secondary">
                      {n.message}
                    </span>
                  )}
                  <span className="text-[10.5px] text-ink-tertiary">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <span className="block px-4 py-6 text-center text-[13px] text-ink-secondary">
                Sin notificaciones por ahora. 🐾
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
