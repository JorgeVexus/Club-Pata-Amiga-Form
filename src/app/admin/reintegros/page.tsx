import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { REIMBURSEMENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatMxn, hoursSince } from "@/lib/format";
import { FilterChips } from "@/components/panel/FilterChips";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  approved: "Aprobado",
  partial: "Parcial",
  rejected: "Rechazado",
  paid: "Pagado",
};

export default async function AdminReintegrosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const admin = createAdminClient();
  const { data: rowsRaw } = await admin
    .from("reimbursements")
    .select(
      "id, folio, category, amount_requested, amount_approved, status, created_at, pets(name, species), profiles!user_id(first_name, last_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (rowsRaw ?? []).filter((r) => !estado || r.status === estado);

  const memberName = (p: unknown) => {
    const prof = (Array.isArray(p) ? p[0] : p) as {
      first_name?: string;
      last_name?: string;
      email?: string;
    } | null;
    return prof?.first_name
      ? `${prof.first_name} ${prof.last_name ?? ""}`.trim()
      : (prof?.email ?? "Miembro");
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-[26px] text-ink-title">Reintegros</h1>
        <a
          href="/api/admin/layouts/reintegros"
          title="CSV con CLABE, beneficiario y monto de los reintegros aprobados del mes — para dispersión masiva (SPEI) en el portal del banco"
          className="grid h-9 place-items-center rounded-full border-[1.5px] border-teal px-4 text-xs font-bold text-teal-deep transition-colors hover:bg-teal hover:text-white"
        >
          ⬇ Layout bancario del mes (CSV)
        </a>
      </div>
      <FilterChips
        basePath="/admin/reintegros"
        current={estado}
        allLabel="Todos"
        options={[
          { value: "pending", label: "Pendientes" },
          { value: "in_review", label: "En revisión" },
          { value: "approved", label: "Aprobados" },
          { value: "rejected", label: "Rechazados" },
          { value: "paid", label: "Pagados" },
        ]}
      />
      <div className="flex flex-col overflow-x-auto rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <div className="grid min-w-[700px] grid-cols-[80px_1fr_120px_100px_100px_90px] gap-2 border-b-[1.5px] border-[#F2EEE4] py-2 text-[10.5px] font-extrabold tracking-[.05em] text-ink-placeholder">
          <span>FOLIO</span>
          <span>MIEMBRO / MASCOTA</span>
          <span>TIPO</span>
          <span>MONTO</span>
          <span>ESTADO</span>
          <span>ESPERA</span>
        </div>
        {(rows ?? []).map((r) => {
          const pet = (Array.isArray(r.pets) ? r.pets[0] : r.pets) as {
            name: string;
            species: string;
          } | null;
          const open = r.status === "pending" || r.status === "in_review";
          return (
            <Link
              key={r.id}
              href={`/admin/reintegros/${r.id}`}
              className="grid min-w-[700px] grid-cols-[80px_1fr_120px_100px_100px_90px] items-center gap-2 border-b border-[#F2EEE4] py-[11px] text-[12.5px] text-ink-body transition-colors hover:bg-cream"
            >
              <span className="font-bold text-teal-deep">{r.folio}</span>
              <span>
                {memberName(r.profiles)} · {pet?.name}{" "}
                {pet?.species === "dog" ? "🐕" : "🐈"}
              </span>
              <span>
                {REIMBURSEMENT_CATEGORY_LABELS[
                  r.category as keyof typeof REIMBURSEMENT_CATEGORY_LABELS
                ] ?? r.category}
              </span>
              <span className="font-bold">
                {formatMxn(Number(r.amount_approved ?? r.amount_requested))}
              </span>
              <span>{STATUS_LABEL[r.status] ?? r.status}</span>
              <span className="text-ink-tertiary">
                {open ? `${hoursSince(r.created_at)} hrs` : "—"}
              </span>
            </Link>
          );
        })}
        {(rows ?? []).length === 0 && (
          <span className="py-3 text-sm text-ink-secondary">
            Sin solicitudes todavía.
          </span>
        )}
      </div>
    </div>
  );
}
