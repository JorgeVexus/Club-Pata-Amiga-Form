import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateEs } from "@/lib/dates";

const STATUS_CHIP: Record<string, { text: string; cls: string }> = {
  active: { text: "ACTIVO", cls: "bg-success-bg text-success-text" },
  pending_payment: { text: "SIN PAGO", cls: "bg-warning-bg text-warning-text" },
  canceled: { text: "CANCELADO", cls: "bg-error-bg text-error-text" },
  past_due: { text: "PAGO VENCIDO", cls: "bg-error-bg text-error-text" },
};

/**
 * Directorio de miembros con buscador global: nombre, correo, mascota o
 * folio (R-#### reintegro · A-#### apelación saltan directo al expediente).
 */
export default async function AdminMiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const admin = createAdminClient();

  // Folio directo: R-#### abre el reintegro, A-#### su apelación
  if (/^r-\d+$/i.test(query)) {
    const { data: r } = await admin
      .from("reimbursements")
      .select("id")
      .eq("folio", query.toUpperCase())
      .maybeSingle();
    if (r) {
      const { redirect } = await import("next/navigation");
      redirect(`/admin/reintegros/${r.id}`);
    }
  }

  let memberIds: string[] | null = null;
  if (query && !/^[ra]-\d+$/i.test(query)) {
    // Mascotas que coincidan → dueños incluidos en el resultado
    const { data: petOwners } = await admin
      .from("pets")
      .select("user_id")
      .ilike("name", `%${query}%`)
      .limit(50);
    memberIds = [...new Set((petOwners ?? []).map((p) => p.user_id))];
  }

  let membersQuery = admin
    .from("profiles")
    .select(
      "id, first_name, last_name, email, phone, membership_status, member_since, created_at, pets!user_id(id), subscriptions(plan, status)",
    )
    .eq("role", "member")
    .order("created_at", { ascending: false })
    .limit(100);

  if (query && !/^[ra]-\d+$/i.test(query)) {
    const like = `%${query.replace(/[%_,]/g, "")}%`;
    const orParts = [
      `first_name.ilike.${like}`,
      `last_name.ilike.${like}`,
      `email.ilike.${like}`,
    ];
    if (memberIds && memberIds.length > 0)
      orParts.push(`id.in.(${memberIds.join(",")})`);
    membersQuery = membersQuery.or(orParts.join(","));
  }

  const { data: members } = await membersQuery;

  const planOf = (subs: { plan: string | null; status: string | null }[]) => {
    const active = (subs ?? []).find((s) => s.status === "active");
    return active?.plan === "annual"
      ? "Anual"
      : active?.plan === "monthly"
        ? "Mensual"
        : "—";
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[26px] text-ink-title">Miembros</h1>
          <p className="text-sm text-ink-secondary">
            {members?.length ?? 0} resultado{members?.length === 1 ? "" : "s"}
            {query ? ` para “${query}”` : " (más recientes)"}
          </p>
        </div>
        <form action="/admin/miembros" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Nombre, correo, mascota o folio…"
            className="h-[42px] w-[280px] rounded-full border-[1.5px] border-border-input bg-white px-4 text-[13px] text-ink-title outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="grid h-[42px] place-items-center rounded-full bg-teal px-5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-col overflow-x-auto rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <div className="grid min-w-[720px] grid-cols-[1fr_110px_90px_130px_90px] gap-2 border-b-[1.5px] border-[#F2EEE4] pb-2 text-[10.5px] font-extrabold tracking-[.05em] text-ink-placeholder">
          <span>MIEMBRO</span>
          <span>ESTATUS</span>
          <span>PLAN</span>
          <span>MIEMBRO DESDE</span>
          <span>MASCOTAS</span>
        </div>
        {(members ?? []).map((m) => {
          const chip =
            STATUS_CHIP[m.membership_status] ?? STATUS_CHIP.pending_payment;
          return (
            <Link
              key={m.id}
              href={`/admin/miembros/${m.id}`}
              className="grid min-w-[720px] grid-cols-[1fr_110px_90px_130px_90px] items-center gap-2 border-b border-[#F2EEE4] py-[11px] text-[12.5px] text-ink-body transition-colors last:border-0 hover:bg-cream"
            >
              <span className="min-w-0">
                <strong className="text-ink-title">
                  {[m.first_name, m.last_name].filter(Boolean).join(" ") ||
                    "Sin nombre"}
                </strong>
                <span className="block truncate text-ink-tertiary">
                  {m.email}
                </span>
              </span>
              <span
                className={`justify-self-start rounded-full px-2.5 py-[3px] text-[10.5px] font-extrabold ${chip.cls}`}
              >
                {chip.text}
              </span>
              <span>{planOf(m.subscriptions ?? [])}</span>
              <span>
                {m.member_since
                  ? formatDateEs(new Date(m.member_since))
                  : "—"}
              </span>
              <span>{(m.pets ?? []).length} 🐾</span>
            </Link>
          );
        })}
        {(members ?? []).length === 0 && (
          <span className="py-4 text-sm text-ink-secondary">
            Sin resultados. Prueba con otro nombre, correo, mascota o folio.
          </span>
        )}
      </div>
    </div>
  );
}
