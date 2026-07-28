"use client";

import { useEffect, useState } from "react";

/**
 * Popup de bienvenida que se muestra UNA sola vez por usuario. Por defecto
 * usa localStorage; si el padre pasa `onDismissAction`, la fuente de verdad
 * es la BD (patrón welcome_shown): el padre decide si renderizarlo y aquí
 * solo se persiste el cierre. Cerrable con click fuera, botón o Escape.
 */
export function WelcomeOnce({
  storageKey,
  emoji,
  title,
  message,
  cta,
  onDismissAction,
}: {
  /** Clave única, ej. `pa_welcome_${userId}` */
  storageKey: string;
  emoji: string;
  title: string;
  message: string;
  cta: string;
  /** Server action que marca la bienvenida como vista en BD */
  onDismissAction?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Con acción de BD, el padre ya filtró (welcome_shown=false) → abrir
    if (onDismissAction || !window.localStorage.getItem(storageKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe tras montar
      setOpen(true);
    }
  }, [storageKey, onDismissAction]);

  const dismiss = () => {
    window.localStorage.setItem(storageKey, new Date().toISOString());
    setOpen(false);
    // La bandera de BD se marca al fondo — el popup no debe esperar la red
    onDismissAction?.().catch(() => {});
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-teal-dark/40 p-5 backdrop-blur-[2px]"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-[24px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(30,83,80,.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[52px]" aria-hidden>
          {emoji}
        </span>
        <h2 className="font-display text-[26px] leading-tight text-ink-title">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">{message}</p>
        <button
          type="button"
          onClick={dismiss}
          className="grid h-12 w-full place-items-center rounded-full bg-teal text-[15px] font-bold text-white transition-colors hover:bg-teal-deep"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
