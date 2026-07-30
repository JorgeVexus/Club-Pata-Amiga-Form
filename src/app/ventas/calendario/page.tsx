import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { PUBLICADORES } from "@/lib/content/registry";
import {
  Calendario,
  type CanalFila,
  type PostFila,
} from "@/components/panel/calendario/Calendario";

export const metadata = { title: "Calendario · Portal de ventas" };

export default async function CalendarioPage() {
  const session = await requirePortal("ventas");
  const admin = createAdminClient();

  const [{ data: posts }, { data: canales }, { data: destinos }, { data: staff }] =
    await Promise.all([
      admin
        .from("content_posts")
        .select(
          "id, title, body, assets, scheduled_for, status, approved_by, approved_at, review_note, campaign, created_by, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        // Ojo: NUNCA se selecciona `credentials`. Los tokens de las cuentas del
        // cliente no salen del servidor.
        .from("content_channels")
        .select("id, platform, handle, display_name, mode, assignee_id, is_active, last_error")
        .order("platform"),
      admin.from("content_post_targets").select("post_id, channel_id, status, external_url, error"),
      admin
        .from("profiles")
        .select("id, first_name, last_name, email, role")
        .in("role", ["ventas", "gerente_ventas", "admin", "super_admin"]),
    ]);

  const nombreDe = new Map(
    (staff ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "Alguien del equipo",
    ]),
  );

  const canalesPorPost = new Map<string, string[]>();
  const resultadoPorPost = new Map<
    string,
    { canalId: string; estado: string; url: string | null; error: string | null }[]
  >();
  for (const d of destinos ?? []) {
    canalesPorPost.set(d.post_id, [...(canalesPorPost.get(d.post_id) ?? []), d.channel_id]);
    resultadoPorPost.set(d.post_id, [
      ...(resultadoPorPost.get(d.post_id) ?? []),
      { canalId: d.channel_id, estado: d.status, url: d.external_url, error: d.error },
    ]);
  }

  const filasCanales: CanalFila[] = (canales ?? []).map((c) => ({
    id: c.id,
    plataforma: c.platform,
    etiqueta: PUBLICADORES[c.platform as keyof typeof PUBLICADORES]?.etiqueta ?? c.platform,
    handle: c.handle,
    nombre: c.display_name,
    modo: c.mode as "automatico" | "asistido",
    // El techo de la plataforma: sirve para explicar por qué una cuenta está
    // en asistido aunque la red sí publique sola.
    modoMaximo:
      PUBLICADORES[c.platform as keyof typeof PUBLICADORES]?.modoMaximo ?? "asistido",
    responsable: c.assignee_id ? (nombreDe.get(c.assignee_id) ?? null) : null,
    responsableId: c.assignee_id,
    activo: c.is_active,
    ultimoError: c.last_error,
  }));

  const filasPosts: PostFila[] = (posts ?? []).map((p) => ({
    id: p.id,
    titulo: p.title,
    cuerpo: p.body,
    activos: (p.assets as string[]) ?? [],
    canalIds: canalesPorPost.get(p.id) ?? [],
    resultados: resultadoPorPost.get(p.id) ?? [],
    programadoPara: p.scheduled_for,
    estado: p.status,
    aprobadoPor: p.approved_by ? (nombreDe.get(p.approved_by) ?? "Alguien del equipo") : null,
    notaDeRevision: p.review_note,
    campana: p.campaign,
    autor: p.created_by ? (nombreDe.get(p.created_by) ?? "Alguien del equipo") : "—",
    esMio: p.created_by === session.userId,
    creadoEl: p.created_at,
  }));

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <h1 className="font-display text-[24px] text-ink-title">Calendario de contenido</h1>

      <p className="text-[12.5px] leading-snug text-ink-secondary">
        Nada se publica sin que un gerente lo apruebe, y eso{" "}
        <strong>no es una regla de esta pantalla</strong>: la base de datos
        rechaza cualquier intento de programar o publicar sin aprobación. Si el
        copy cambia después de aprobarse, el contenido vuelve a revisión solo.
      </p>

      <Calendario
        posts={filasPosts}
        canales={filasCanales}
        equipo={(staff ?? []).map((p) => ({
          id: p.id,
          nombre: nombreDe.get(p.id) ?? "Equipo",
        }))}
        puedeRedactar={session.can["contenido.redactar"]}
        puedeAprobar={session.can["contenido.aprobar"]}
        puedeCanales={session.can["canales.administrar"]}
        puedeSaltar={session.can["contenido.saltar_validaciones"]}
      />
    </div>
  );
}
