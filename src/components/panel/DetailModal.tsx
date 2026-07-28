"use client";

import { useEffect, useState } from "react";

/**
 * Popup de detalle para las colas del panel (patrón MemberDetailModal del
 * sitio vivo): el contenido llega renderizado del servidor como children y
 * se abre al hacer click en el disparador.
 */
export function DetailModal({
  triggerLabel = "Ver todo",
  title,
  children,
  trigger,
}: {
  triggerLabel?: string;
  title: string;
  children: React.ReactNode;
  /**
   * Disparador a la medida: si se pasa, TODO el nodo es clickeable (p. ej.
   * una fila de lista completa) en lugar del botón "Ver todo".
   */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {trigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full rounded-[10px] text-left transition-colors hover:bg-cream/70"
          title="Ver detalle"
        >
          {trigger}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-full border-[1.5px] border-border-input px-3.5 py-1.5 text-[11.5px] font-bold text-teal-deep transition-colors hover:border-teal"
        >
          🔍 {triggerLabel}
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-teal-dark/40 p-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_rgba(30,83,80,.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-divider px-5 py-3.5">
              <span className="font-display text-lg text-ink-title">
                {title}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="grid size-8 place-items-center rounded-full text-ink-secondary hover:bg-cream"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Sección de datos sensibles (CURP, bancarios, dirección, fiscales).
 * Solo el super admin ve el contenido; el admin ve un aviso de que existe
 * pero está restringido — así el dato nunca llega al navegador de mandos
 * medios (el filtrado ocurre en el servidor al renderizar).
 */
export function SensitiveBlock({
  isSuper,
  children,
}: {
  isSuper: boolean;
  children: React.ReactNode;
}) {
  if (!isSuper) {
    return (
      <p className="rounded-[12px] bg-cream px-3.5 py-2.5 text-xs text-ink-tertiary">
        🔒 Los datos sensibles (identidad, dirección, bancarios y fiscales)
        solo son visibles para el super admin.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2.5 rounded-[12px] border-[1.5px] border-orange/40 bg-orange/5 p-3.5">
      <span className="text-[10.5px] font-extrabold tracking-[.05em] text-orange">
        🔒 SOLO SUPER ADMIN
      </span>
      {children}
    </div>
  );
}

/** Par etiqueta/valor para los grids de detalle. */
export function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col">
      <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
        {label}
      </span>
      <span className="text-[13px] text-ink-body">{value}</span>
    </div>
  );
}
