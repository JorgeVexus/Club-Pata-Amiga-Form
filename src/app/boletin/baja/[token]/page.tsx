import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { darDeBaja } from "./actions";

export const metadata: Metadata = {
  title: "Darte de baja del boletín · Club Pata Amiga",
  // Una página con el token de alguien no tiene por qué acabar en un buscador.
  robots: { index: false, follow: false },
};

/**
 * Baja del boletín — sin sesión, con el token del correo.
 *
 * POR QUÉ HAY UN BOTÓN Y NO SE DA DE BAJA AL ABRIR: los clientes de correo y
 * los antivirus visitan los enlaces por su cuenta para revisarlos. Si la baja
 * ocurriera al cargar la página, esa visita automática daría de baja a alguien
 * que nunca hizo clic. Sigue siendo un clic de la persona, sin contraseña.
 */
export default async function BajaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: suscriptor } = await admin
    .from("newsletter_subscribers")
    .select("email, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-5 py-12">
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-[20px] bg-white p-7 text-center shadow-[0_2px_16px_rgba(30,83,80,.08)]">
        <span className="text-[34px]">🐾</span>

        {!suscriptor && (
          <>
            <h1 className="font-display text-[22px] text-ink-title">
              Este enlace ya no sirve
            </h1>
            <p className="text-[13.5px] leading-relaxed text-ink-secondary">
              No encontramos una suscripción con este enlace. Puede que ya te
              hayas dado de baja o que el enlace esté incompleto.
            </p>
          </>
        )}

        {suscriptor?.status === "baja" && (
          <>
            <h1 className="font-display text-[22px] text-ink-title">
              Ya estabas dado de baja
            </h1>
            <p className="text-[13.5px] leading-relaxed text-ink-secondary">
              No vamos a mandarte más boletines a{" "}
              <strong>{suscriptor.email}</strong>.
            </p>
          </>
        )}

        {suscriptor && suscriptor.status !== "baja" && (
          <>
            <h1 className="font-display text-[22px] text-ink-title">
              ¿Dejamos de mandarte el boletín?
            </h1>
            <p className="text-[13.5px] leading-relaxed text-ink-secondary">
              Dejarías de recibirlo en <strong>{suscriptor.email}</strong>. Si
              tienes una membresía, esto <strong>no la toca</strong>: los
              correos de tu cuenta te seguirán llegando.
            </p>
            <form action={darDeBaja}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded-full bg-teal px-6 py-3 text-[14px] font-bold text-white hover:bg-teal-deep"
              >
                Sí, darme de baja
              </button>
            </form>
            <a
              href="https://www.pataamiga.mx"
              className="text-[12.5px] font-semibold text-ink-tertiary underline"
            >
              Mejor no, llévame al sitio
            </a>
          </>
        )}
      </div>
    </div>
  );
}
