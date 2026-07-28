"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Campo con sugerencias mientras se escribe (razas, colores) — patrón del
 * sitio anterior con nuestra estética. Navegable con ↑ ↓ Enter Esc.
 *
 * - `options`: catálogo completo; se filtra por coincidencia (sin acentos).
 * - Si lo tecleado no está en el catálogo, el valor libre se conserva
 *   (ej. "Otra" raza que el usuario escribe tal cual).
 * - Enter con una sugerencia resaltada la elige; sin sugerencias, deja que
 *   el form continúe (paso siguiente).
 */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function AutocompleteField({
  label,
  options,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo(() => {
    if (!value.trim()) return options.slice(0, 8);
    const needle = norm(value);
    return options.filter((o) => norm(o).includes(needle)).slice(0, 8);
  }, [options, value]);

  // Cerrar al hacer click fuera (sin depender del blur, que se come el click)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((p) => (p < suggestions.length - 1 ? p + 1 : p));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((p) => (p > 0 ? p - 1 : p));
    } else if (e.key === "Enter") {
      if (active >= 0 && active < suggestions.length) {
        e.preventDefault(); // elige la sugerencia; no envía el form
        onChange(suggestions[active]);
        setOpen(false);
        setActive(-1);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={wrapRef}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-title">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          autoComplete="off"
          required={required}
          value={value}
          placeholder={placeholder ?? "Escribe para buscar…"}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-12 w-full rounded-[12px] border-[1.5px] border-border-input bg-white px-4 text-[15px] text-ink-title placeholder:text-ink-placeholder outline-none focus:border-teal focus:border-2"
        />
        {open && suggestions.length > 0 && (
          <ul id={`${id}-listbox`} role="listbox" className="absolute inset-x-0 top-[calc(100%+4px)] z-30 max-h-[220px] overflow-y-auto rounded-[12px] border-[1.5px] border-border-input bg-white py-1 shadow-[0_8px_24px_rgba(30,83,80,.12)]">
            {suggestions.map((opt, i) => (
              <li key={opt}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setActive(-1);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-[14px] ${
                    i === active
                      ? "bg-info-bg font-semibold text-teal-deep"
                      : "text-ink-body hover:bg-cream"
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <span className="text-xs text-ink-tertiary">{hint}</span>}
    </div>
  );
}
