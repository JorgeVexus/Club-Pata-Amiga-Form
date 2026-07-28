import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ProfileMenu, type DashboardEntry } from "@/components/app/ProfileMenu";
import { AmbassadorNav } from "./AmbassadorNav";
import { getAmbassadorContext } from "./shared";

function StatusScreen({
  name,
  status,
  reason,
}: {
  name: string;
  status: string;
  reason: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-4 rounded-[20px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(30,83,80,.06)]">
      <span className="text-[42px]" aria-hidden>
        {status === "pending" ? "⏳" : "💌"}
      </span>
      <h1 className="font-display text-[24px] text-ink-title">
        {status === "pending"
          ? `Tu solicitud está en revisión, ${name}`
          : "Tu solicitud no fue aprobada"}
      </h1>
      <p className="text-sm leading-relaxed text-ink-secondary">
        {status === "pending"
          ? "El comité está revisando tu solicitud de embajador. Te avisaremos por correo en cuanto haya resolución."
          : (reason ??
            "El comité no pudo aprobar tu solicitud en esta ocasión. Puedes escribirnos si crees que hay un error.")}
      </p>
      <Link href="/" className="font-semibold text-teal-deep hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}

/** Shell del portal del embajador: header + menú (tabs / barra móvil). */
export default async function EmbajadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, ambassador, isMember, wasMember } =
    await getAmbassadorContext();

  // Otros paneles de esta cuenta (cambio estilo Instagram desde el avatar)
  const admin = createAdminClient();
  const { data: centerRows } = await admin
    .from("wellness_centers")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "approved")
    .limit(1);

  const entries: DashboardEntry[] = [
    ...(isMember
      ? [{ href: "/app", icon: "🐾", label: "Panel de miembro" }]
      : []),
    ...(centerRows?.length
      ? [{ href: "/centro", icon: "🏪", label: "Mi centro aliado" }]
      : []),
  ];

  const displayName = `${ambassador.first_name}${ambassador.last_name ? ` ${ambassador.last_name.charAt(0)}.` : ""}`;
  const header = (
    <PublicHeader
      badge="EMBAJADOR"
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="hidden text-[13.5px] font-bold text-ink-title sm:inline">
            {displayName}
          </span>
          <ProfileMenu
            initial={ambassador.first_name.charAt(0).toUpperCase()}
            color="bg-orange"
            entries={entries}
            settingsHref="/embajador/cuenta"
          />
        </div>
      }
    />
  );

  if (ambassador.status !== "approved") {
    return (
      <div className="min-h-dvh bg-cream">
        {header}
        <div className="px-5 py-12">
          <StatusScreen
            name={ambassador.first_name}
            status={ambassador.status}
            reason={ambassador.rejection_reason}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream pb-24 sm:pb-0">
      {header}
      <AmbassadorNav />
      {/* Embajador sin plan activo: invitación a unirse (o reactivar) como miembro */}
      {!isMember && (
        <div className="mx-auto w-full max-w-[980px] px-5 pt-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-teal-deep px-5 py-4 text-white shadow-[0_2px_10px_rgba(30,83,80,.12)]">
            <div className="flex min-w-0 flex-col">
              <span className="font-display text-[17px]">
                Tú también puedes cuidar a tu manada 🐾
              </span>
              <span className="text-[12.5px] opacity-90">
                {wasMember
                  ? "Tu membresía no está activa. Reactívala para volver a cuidar a tus peludos."
                  : "Como embajador aún no tienes membresía. Únete y registra hasta 3 mascotas."}
              </span>
            </div>
            <Link
              href={wasMember ? "/app/cuenta" : "/registro/peludo"}
              className="flex-none rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-teal-deep transition-opacity hover:opacity-90"
            >
              {wasMember ? "Reactivar mi membresía" : "Quiero mi membresía"}
            </Link>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
