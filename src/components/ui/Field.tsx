import { type InputHTMLAttributes, type SelectHTMLAttributes, useId } from "react";

const inputClass =
  "h-12 w-full rounded-[12px] border-[1.5px] border-border-input bg-white px-4 text-[15px] text-ink-title placeholder:text-ink-placeholder outline-none focus:border-teal focus:border-2";

export function TextField({
  label,
  hint,
  rightSlot,
  inputRef,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  /** React 19: ref al <input> (usado por el autocompletado de direcciones). */
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-title">
        {label}
      </label>
      <div className="relative">
        <input id={id} ref={inputRef} className={inputClass} {...props} />
        {rightSlot && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
      {hint && <span className="text-xs text-ink-tertiary">{hint}</span>}
    </div>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-title">
        {label}
      </label>
      <select id={id} className={`${inputClass} appearance-none`} {...props}>
        {children}
      </select>
    </div>
  );
}

/** Pill-less segmented toggle used for Especie (Perro/Gato) and Años/Meses. */
export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label className="text-[13px] font-semibold text-ink-title">
          {label || " "}
        </label>
      )}
      <div className="flex gap-2.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              opt.value === value
                ? "h-12 flex-1 rounded-[12px] bg-teal text-[15px] font-bold text-white grid place-items-center"
                : "h-12 flex-1 rounded-[12px] border-[1.5px] border-border-input bg-white text-[15px] font-semibold text-ink-secondary grid place-items-center hover:border-teal transition-colors"
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
