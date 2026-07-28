import Image from "next/image";
import Link from "next/link";

/** White top bar for public pages (directorio de centros, embajadores). */
export function PublicHeader({
  badge,
  rightSlot,
}: {
  badge?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border-divider bg-white px-5 py-3.5 sm:px-8">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Image
            src="/brand/logo-light-bg.svg"
            alt="Pata Amiga"
            width={118}
            height={42}
            className="h-[42px] w-auto"
            priority
          />
        </Link>
        {badge && (
          <span className="rounded-full bg-warning-bg px-3 py-[5px] text-[10.5px] font-extrabold tracking-[.06em] text-warning-text">
            {badge}
          </span>
        )}
      </div>
      {rightSlot ?? (
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="font-semibold text-ink-secondary transition-colors hover:text-teal-deep"
          >
            Inicio
          </Link>
          <Link href="/iniciar-sesion" className="font-semibold text-teal-deep">
            Inicia sesión
          </Link>
        </div>
      )}
    </header>
  );
}
