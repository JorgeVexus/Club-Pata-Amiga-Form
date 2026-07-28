"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PORTALS, type Portal } from "@/lib/permissions";

/**
 * Tarjeta de perfil al pie de la barra lateral. Si la cuenta tiene acceso a más
 * de un portal (admin y super admin), se vuelve un botón que abre
 * "Cambiar de portal" — así se cambia de tablero desde el propio perfil.
 *
 * Con un solo portal se ve exactamente igual que antes, sin botón: los roles de
 * ventas no deben ni enterarse de que existe otro panel.
 */
export function ProfileMenu({
  displayName,
  roleLabel,
  portals,
  current,
  compact = false,
}: {
  displayName: string;
  roleLabel: string;
  portals: Portal[];
  current: Portal;
  /** Versión móvil: solo el avatar. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canSwitch = portals.length > 1;
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const avatar = (
    <div className="grid size-[34px] flex-none place-items-center rounded-full bg-lime text-[13px] font-extrabold text-teal-dark">
      {initial}
    </div>
  );

  const identity = (
    <div className="flex min-w-0 flex-col text-left">
      <span className="truncate text-[12.5px] font-bold text-white">
        {displayName}
      </span>
      <span className="text-[10.5px] text-white/60">{roleLabel}</span>
    </div>
  );

  // Sin conmutador: mismo aspecto de siempre, sin interacción.
  if (!canSwitch) {
    if (compact) return avatar;
    return (
      <div className="flex items-center gap-2.5 rounded-[12px] bg-black/[.18] p-3">
        {avatar}
        {identity}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Perfil y cambio de portal"
        className={
          compact
            ? "block rounded-full transition-opacity hover:opacity-80"
            : "flex w-full items-center gap-2.5 rounded-[12px] bg-black/[.18] p-3 text-left transition-colors hover:bg-black/[.28]"
        }
      >
        {avatar}
        {!compact && identity}
        {!compact && (
          <span aria-hidden className="ml-auto text-[11px] text-white/50">
            {open ? "▾" : "▸"}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-40 flex w-[212px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(30,83,80,.22)] ${
            compact ? "right-0 top-[42px]" : "bottom-[62px] left-0"
          }`}
        >
          <span className="border-b border-border-divider px-3.5 py-2.5 text-[10.5px] font-extrabold tracking-[.08em] text-ink-tertiary">
            CAMBIAR DE PORTAL
          </span>
          {portals.map((p) => {
            const isCurrent = p === current;
            return (
              <Link
                key={p}
                href={PORTALS[p].href}
                onClick={() => setOpen(false)}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex items-center gap-2.5 border-b border-border-divider px-3.5 py-2.5 text-[13px] transition-colors last:border-0 hover:bg-cream ${
                  isCurrent
                    ? "font-bold text-ink-title"
                    : "font-semibold text-ink-body"
                }`}
              >
                <span aria-hidden>{PORTALS[p].icon}</span>
                {PORTALS[p].name}
                {isCurrent && (
                  <span aria-hidden className="ml-auto text-teal">
                    ✓
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
