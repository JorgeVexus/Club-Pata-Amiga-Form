"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 60) return `hace ${Math.max(mins, 1)} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    return `hace ${Math.floor(hrs / 24)} d`;
  };

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

      {open && (
        <div className="absolute right-0 top-[52px] z-40 flex w-[320px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(30,83,80,.18)]">
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
