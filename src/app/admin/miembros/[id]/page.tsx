import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeactivateAccountPanel } from "./DeactivateAccountPanel";
import { formatDateEs } from "@/lib/dates";
import { formatMxn } from "@/lib/format";
import { REIMBURSEMENT_CATEGORY_LABELS } from "@/lib/constants";
import { PetThreadPanel } from "./PetThreadPanel";
import { PetResolveButtons } from "../../mascotas/PetResolveButtons";

const STATUS_CHIP: Record<string, { text: string; cls: string }> = {
  active: { text: "ACTIVO", cls: "bg-success-bg text-success-text" },
  pending_payment: { text: "SIN PAGO", cls: "bg-warning-bg text-warning-text" },
  canceled: { text: "CANCELADO", cls: "bg-error-bg text-error-text" },
  past_due: { text: "PAGO VENCIDO", cls: "bg-error-bg text-error-text" },
};

const PET_CHIP: Record<string, { text: string; cls: string }> = {
  approved: { text: "APROBADA", cls: "bg-success-bg text-success-text" },
  pending: { text: "EN REVISIÓN", cls: "bg-warning-bg text-warning-text" },
  rejected: { text: "DENEGADA", cls: "bg-error-bg text-error-text" },
};

/** Expediente del miembro: contacto, fiscal, mascotas, reintegros, apelaciones. */
export default async function AdminMiembroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ¿Soy super admin? (la baja de cuentas es exclusiva del super admin)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const isSuper = myProfile?.role === "super_admin";
  const admin = createAdminClient();

  const [{ data: m }, { data: pets }, { data: reimbs }, { data: appeals }, { data: sub }] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, first_name, last_name, mother_last_name, email, phone, curp, birth_date, membership_status, member_since, waiting_period_end_date, postal_code, state, city, colony, street_address, ambassador_code_used, cfdi_requested, rfc, razon_social, regimen_fiscal, uso_cfdi, cp_fiscal, created_at, bank_name, clabe",
        )
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("pets")
        .select(
          "id, name, species, breed, sex, age_years, age_months, coat_color, eye_color, nose_color, is_adopted, adoption_story, is_senior, photo_url, gallery_photos, vet_certificate_url, approval_status, is_active, deactivation_reason, waiting_period_end_date, info_requested, pet_messages(id, sender, message, requested_items, created_at)",
        )
        .eq("user_id", id)
        .order("created_at", { ascending: true }),
      admin
        .from("reimbursements")
        .select("id, folio, category, amount_requested, amount_approved, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("appeals")
        .select("id, folio, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("subscriptions")
        .select("plan, amount, status, cancel_at_period_end, current_period_end")
        .eq("user_id", id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  if (!m) notFound();

  // Documentos de identidad (INE) con links firmados — bucket privado
  const { data: docs } = await admin
    .from("documents")
    .select("document_type, file_path, file_name, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  const ineDocs = await Promise.all(
    (docs ?? []).map(async (d) => {
      const { data: signed } = await admin.storage
        .from("ine-documents")
        .createSignedUrl(d.file_path, 3600);
      return { ...d, url: signed?.signedUrl ?? null };
    }),
  );

  const chip = STATUS_CHIP[m.membership_status] ?? STATUS_CHIP.pending_payment;
  const fullName =
    [m.first_name, m.last_name, m.mother_last_name].filter(Boolean).join(" ") ||
    "Sin nombre";
  const address = [m.street_address, m.colony, m.city, m.state, m.postal_code ? `CP ${m.postal_code}` : null]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/miembros"
          className="text-sm font-semibold text-teal-deep"
        >
          ← Miembros
        </Link>
        <h1 className="font-display text-[26px] text-ink-title">{fullName}</h1>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${chip.cls}`}
        >
          {chip.text}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Contacto y membresía */}
        <div className="flex flex-col gap-2 rounded-[18px] bg-white p-5 text-[13px] text-ink-body shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <span className="text-[11px] font-extrabold tracking-[.06em] text-teal-deep">
            CONTACTO Y MEMBRESÍA
          </span>
          <span>
            ✉️{" "}
            <a href={`mailto:${m.email}`} className="font-semibold text-teal-deep">
              {m.email}
            </a>
            {m.phone ? ` · 📞 ${m.phone}` : ""}
          </span>
          <span>CURP: {m.curp ?? "—"}</span>
          <span>Domicilio: {address || "—"}</span>
          <span>
            Miembro desde:{" "}
            {m.member_since ? formatDateEs(new Date(m.member_since)) : "—"} ·
            Registro: {formatDateEs(new Date(m.created_at))}
          </span>
          <span>
            Período de espera (contratante):{" "}
            {m.waiting_period_end_date
              ? `termina el ${formatDateEs(m.waiting_period_end_date)}`
              : "—"}
          </span>
          <span>
            Plan:{" "}
            {sub
              ? `${sub.plan === "annual" ? "Anual" : "Mensual"} · ${formatMxn(Number(sub.amount ?? 0))} MXN${sub.cancel_at_period_end ? " · CANCELA AL CORTE" : ""}`
              : "sin suscripción activa"}
          </span>
          {m.ambassador_code_used && (
            <span>Código de embajador usado: {m.ambassador_code_used}</span>
          )}
          <span>
            Banco: {m.bank_name ?? "—"}
            {m.clabe ? ` · CLABE ····${String(m.clabe).slice(-4)}` : ""}
          </span>
          {ineDocs.length > 0 && (
            <span className="flex flex-wrap items-center gap-2">
              Identificación:
              {ineDocs.map((d, i) =>
                d.url ? (
                  <a
                    key={`${d.file_path}-${i}`}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-teal-deep hover:underline"
                  >
                    🪪 {d.document_type === "ine_front" ? "INE frente" : d.document_type === "ine_back" ? "INE reverso" : d.document_type}
                  </a>
                ) : null,
              )}
            </span>
          )}
        </div>

        {/* Fiscal */}
        <div className="flex flex-col gap-2 rounded-[18px] bg-white p-5 text-[13px] text-ink-body shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <span className="text-[11px] font-extrabold tracking-[.06em] text-teal-deep">
            FACTURACIÓN (CFDI)
          </span>
          {m.cfdi_requested ? (
            <>
              <span className="font-bold text-ink-title">{m.razon_social}</span>
              <span>RFC: {m.rfc}</span>
              <span>
                Régimen: {m.regimen_fiscal ?? "—"} · Uso: {m.uso_cfdi ?? "—"} ·
                CP fiscal: {m.cp_fiscal ?? "—"}
              </span>
              <span className="text-xs text-warning-text">
                Requiere factura en cada cobro.
              </span>
            </>
          ) : (
            <span className="text-ink-secondary">No solicita factura.</span>
          )}
        </div>
      </div>

      {/* Mascotas */}
      <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <span className="text-[11px] font-extrabold tracking-[.06em] text-teal-deep">
          MASCOTAS ({(pets ?? []).length})
        </span>
        {(pets ?? []).map((p) => {
          const pchip = PET_CHIP[p.approval_status] ?? PET_CHIP.pending;
          const thread = [...(p.pet_messages ?? [])].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
          return (
            <div key={p.id} className="flex flex-col gap-1.5 border-b border-[#F2EEE4] pb-3 last:border-0">
              <div className="flex items-start gap-3 text-[13px] text-ink-body">
                {/* Expediente completo de la mascota: foto, datos y documentos */}
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    className="size-[52px] flex-none rounded-[12px] object-cover"
                  />
                ) : (
                  <span
                    className="grid size-[52px] flex-none place-items-center rounded-[12px] bg-info-bg text-[20px]"
                    aria-hidden
                  >
                    {p.species === "dog" ? "🐕" : "🐈"}
                  </span>
                )}
                <span className="flex-1">
                  <strong className="text-ink-title">{p.name}</strong>
                  {p.breed ? ` · ${p.breed}` : ""}
                  {p.age_years
                    ? ` · ${p.age_years} año${p.age_years === 1 ? "" : "s"}`
                    : p.age_months
                      ? ` · ${p.age_months} meses`
                      : ""}
                  {p.sex ? ` · ${p.sex === "male" ? "macho" : "hembra"}` : ""}
                  {!p.is_active
                    ? ` · 🕊️ dada de baja${p.deactivation_reason ? ` (${p.deactivation_reason})` : ""}`
                    : ""}
                  {p.waiting_period_end_date
                    ? ` · espera termina ${formatDateEs(p.waiting_period_end_date)}`
                    : ""}
                  <span className="block text-[11.5px] text-ink-tertiary">
                    {[
                      p.coat_color ? `pelaje ${p.coat_color}` : null,
                      p.eye_color ? `ojos ${p.eye_color}` : null,
                      p.nose_color ? `nariz ${p.nose_color}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "sin señas registradas"}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.is_adopted && (
                      <span className="rounded-full bg-success-bg px-2 py-0.5 text-[9.5px] font-extrabold text-success-text">
                        🏠 ADOPTADO
                      </span>
                    )}
                    {p.is_senior && (
                      <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[9.5px] font-extrabold text-warning-text">
                        👴 SENIOR
                      </span>
                    )}
                    {p.vet_certificate_url && (
                      <a
                        href={p.vet_certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] font-bold text-teal-deep hover:underline"
                      >
                        🏥 Certificado vet
                      </a>
                    )}
                    {(p.gallery_photos ?? []).map((g: string, gi: number) => (
                      <a
                        key={g}
                        href={g}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] font-bold text-teal-deep hover:underline"
                      >
                        📸 Foto {gi + 1}
                      </a>
                    ))}
                  </span>
                  {p.adoption_story && (
                    <span className="mt-1 block rounded-[8px] bg-cream px-2.5 py-1.5 text-[11.5px] italic text-ink-secondary">
                      «{p.adoption_story}»
                    </span>
                  )}
                </span>
                <span className="flex flex-none flex-col items-end gap-2">
                  <span className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-extrabold ${pchip.cls}`}>
                    {!p.is_active ? "🕊️ BAJA" : pchip.text}
                  </span>
                  {/* Resolver desde el expediente, sin ir a Mascotas (equipo, 5-ago) */}
                  {p.is_active && p.approval_status === "pending" && (
                    <PetResolveButtons petId={p.id} />
                  )}
                </span>
              </div>
              <PetThreadPanel
                petId={p.id}
                petName={p.name}
                infoRequested={p.info_requested}
                thread={thread}
              />
            </div>
          );
        })}
        {(pets ?? []).length === 0 && (
          <span className="text-sm text-ink-secondary">Sin mascotas registradas.</span>
        )}
      </div>

      {/* Reintegros y apelaciones */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <span className="text-[11px] font-extrabold tracking-[.06em] text-teal-deep">
            REINTEGROS ({(reimbs ?? []).length})
          </span>
          {(reimbs ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/admin/reintegros/${r.id}`}
              className="flex items-center gap-2 text-[13px] text-ink-body hover:text-teal-deep"
            >
              <span className="font-bold text-teal-deep">{r.folio}</span>
              <span className="flex-1">
                {REIMBURSEMENT_CATEGORY_LABELS[
                  r.category as keyof typeof REIMBURSEMENT_CATEGORY_LABELS
                ] ?? r.category}{" "}
                · {formatMxn(Number(r.amount_approved ?? r.amount_requested))} MXN
              </span>
              <span className="text-[11px] uppercase text-ink-tertiary">
                {r.status}
              </span>
            </Link>
          ))}
          {(reimbs ?? []).length === 0 && (
            <span className="text-sm text-ink-secondary">Sin solicitudes.</span>
          )}
        </div>

        <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
          <span className="text-[11px] font-extrabold tracking-[.06em] text-teal-deep">
            APELACIONES ({(appeals ?? []).length})
          </span>
          {(appeals ?? []).map((a) => (
            <Link
              key={a.id}
              href="/admin/apelaciones"
              className="flex items-center gap-2 text-[13px] text-ink-body hover:text-teal-deep"
            >
              <span className="font-bold text-teal-deep">{a.folio}</span>
              <span className="flex-1">
                {formatDateEs(new Date(a.created_at))}
              </span>
              <span className="text-[11px] uppercase text-ink-tertiary">
                {a.status}
              </span>
            </Link>
          ))}
          {(appeals ?? []).length === 0 && (
            <span className="text-sm text-ink-secondary">Sin apelaciones.</span>
          )}
        </div>
      </div>

      {isSuper && m.membership_status !== "canceled" && (
        <DeactivateAccountPanel userId={m.id} memberName={fullName} />
      )}
    </div>
  );
}
