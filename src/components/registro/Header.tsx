import Image from "next/image";
import Link from "next/link";

/**
 * Registration header. Desktop: white bar with logo + right slot (1a/1c).
 * Mobile: logo + step label over cream (1e).
 */
export function RegistroHeader({ step }: { step: 1 | 2 | 3 }) {
  return (
    <>
      {/* Desktop */}
      <header className="hidden items-center justify-between border-b border-border-divider bg-white px-8 py-3.5 sm:flex">
        <Link href="/">
          <Image
            src="/brand/logo-light-bg.svg"
            alt="Pata Amiga"
            width={130}
            height={46}
            className="h-[46px] w-auto"
            priority
          />
        </Link>
        {step === 1 ? (
          <div className="text-sm text-ink-secondary">
            ¿Ya eres de la manada?{" "}
            <Link
              href="/iniciar-sesion"
              className="font-semibold text-teal-deep"
            >
              Inicia sesión
            </Link>
          </div>
        ) : (
          <div className="text-[13px] text-ink-tertiary">
            Paso {step} de 3 ·{" "}
            {step === 2 ? "Tu peludo" : "Plan y pago"}
          </div>
        )}
      </header>
      {/* Mobile */}
      <div className="flex items-center justify-between px-5 pt-4 sm:hidden">
        <Link href="/">
          <Image
            src="/brand/logo-light-bg.svg"
            alt="Pata Amiga"
            width={107}
            height={38}
            className="h-[38px] w-auto"
            priority
          />
        </Link>
        <span className="text-xs font-semibold text-ink-tertiary">
          Paso {step} de 3
        </span>
      </div>
    </>
  );
}
