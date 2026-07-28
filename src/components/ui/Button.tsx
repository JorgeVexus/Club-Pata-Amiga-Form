import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "white";

const styles: Record<Variant, string> = {
  primary:
    "h-[52px] rounded-full bg-teal text-white text-base font-bold grid place-items-center px-7 hover:bg-teal-deep transition-colors disabled:opacity-60 disabled:pointer-events-none",
  outline:
    "h-[52px] rounded-full border-[1.5px] border-border-input text-ink-secondary text-base font-semibold grid place-items-center px-7 hover:border-teal hover:text-teal-deep transition-colors disabled:opacity-60 disabled:pointer-events-none",
  ghost:
    "h-[46px] rounded-full bg-info-bg text-info-text text-sm font-bold grid place-items-center px-6 hover:bg-teal hover:text-white transition-colors disabled:opacity-60 disabled:pointer-events-none",
  white:
    "h-[52px] rounded-full bg-white text-teal-deep text-[15px] font-bold grid place-items-center px-7 hover:bg-cream-light transition-colors disabled:opacity-60 disabled:pointer-events-none",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button", // dentro de un form solo type="submit" envía: Enter = paso siguiente, nunca un botón secundario
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type={type} className={`${styles[variant]} ${className}`} {...props} />
  );
}
