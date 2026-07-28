"use client";

import { useId } from "react";

/**
 * Teléfono mexicano (regla del sitio anterior): prefijo fijo 🇲🇽 +52,
 * solo dígitos, máximo 10, con formato automático "123 123 1234".
 * `value` guarda solo los dígitos (sin formato) para la BD.
 */
export function formatMxPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function PhoneField({
  label,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (digits: string) => void;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-title">
        {label}
      </label>
      <div className="flex h-12 w-full items-center rounded-[12px] border-[1.5px] border-border-input bg-white focus-within:border-2 focus-within:border-teal">
        <span className="flex items-center gap-1.5 border-r border-border-divider px-3.5 text-[15px]">
          <span aria-hidden>🇲🇽</span>
          <span className="font-semibold text-ink-secondary">+52</span>
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          required={required}
          value={formatMxPhone(value)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="123 123 1234"
          autoComplete="tel-national"
          maxLength={12} /* 10 dígitos + 2 espacios */
          className="h-full min-w-0 flex-1 rounded-r-[12px] bg-transparent px-3.5 text-[15px] text-ink-title outline-none placeholder:text-ink-placeholder"
        />
      </div>
      {hint && <span className="text-xs text-ink-tertiary">{hint}</span>}
    </div>
  );
}
