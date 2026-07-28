import Image from "next/image";

/**
 * Mockup CSS del registro móvil (paso 1) para la sección ¿Cómo funciona?,
 * al estilo del teléfono del sitio anterior. Al ser markup (no foto) siempre
 * se ve nítido y en paleta; subir una imagen al slot landing-como-funciona
 * desde /admin/sitio lo reemplaza.
 */
export function PhoneMockup() {
  return (
    <div className="mx-auto w-[290px] rounded-[44px] bg-teal-dark p-[10px] shadow-[0_24px_60px_rgba(30,83,80,.25)]">
      <div className="flex flex-col overflow-hidden rounded-[36px] bg-cream">
        {/* status bar + notch */}
        <div className="relative flex h-9 items-center justify-center bg-teal">
          <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-[12px] bg-teal-dark" />
        </div>
        {/* mini app screen */}
        <div className="flex flex-col gap-3 px-5 pb-7 pt-4">
          <div className="flex items-center justify-between">
            <Image
              src="/brand/logo-light-bg.svg"
              alt=""
              width={62}
              height={22}
              className="h-[22px] w-auto"
            />
            <span className="rounded-full bg-info-bg px-2.5 py-1 text-[9px] font-extrabold tracking-[.06em] text-info-text">
              PASO 1 DE 3
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-1.5 flex-1 rounded-full bg-teal" />
            <span className="h-1.5 flex-1 rounded-full bg-border-divider" />
            <span className="h-1.5 flex-1 rounded-full bg-border-divider" />
          </div>
          <span className="font-display text-[19px] text-ink-title">
            Únete a la manada
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold tracking-[.05em] text-ink-tertiary">
              CORREO ELECTRÓNICO
            </span>
            <div className="flex h-9 items-center rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[11px] text-ink-secondary">
              hola@pataamiga.mx
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold tracking-[.05em] text-ink-tertiary">
              CONTRASEÑA
            </span>
            <div className="flex h-9 items-center justify-between rounded-[10px] border-[1.5px] border-border-input bg-white px-3">
              <span className="text-[11px] tracking-[.2em] text-ink-title">
                ••••••••
              </span>
              <span className="text-[10px] font-bold text-teal-deep">
                Mostrar
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9.5px] font-bold tracking-[.05em] text-ink-tertiary">
              TELÉFONO
            </span>
            <div className="flex h-9 items-center gap-2 rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[11px]">
              <span className="font-bold text-ink-title">MX +52</span>
              <span className="text-ink-placeholder">123 123 1234</span>
            </div>
          </div>
          <div className="mt-1 grid h-10 place-items-center rounded-full bg-teal text-[12px] font-bold text-white">
            Continuar
          </div>
          <span className="text-center text-[9px] text-ink-tertiary">
            🐾 Orientación veterinaria 24/7 desde el día uno
          </span>
        </div>
      </div>
    </div>
  );
}
