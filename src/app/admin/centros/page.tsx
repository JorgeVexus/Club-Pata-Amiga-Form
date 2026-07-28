import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateEs } from "@/lib/dates";
import { WELLNESS_SERVICES, type WellnessService } from "@/lib/constants";
import { DetailModal, DetailItem } from "@/components/panel/DetailModal";
import { FilterChips } from "@/components/panel/FilterChips";
import { CenterReviewRow } from "./CenterReviewRow";

type Row = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  services: string[];
  member_benefit: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  wellness_center_locations: {
    address: string | null;
    colony: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  }[];
  center_promotions: {
    title: string;
    discount_label: string | null;
    is_active: boolean;
    valid_until: string | null;
  }[];
};

const serviceLabels = (services: string[]) =>
  services
    .map((s) => WELLNESS_SERVICES[s as WellnessService]?.label ?? s)
    .join(" · ")
    .toUpperCase();

const locationLabel = (l: Row["wellness_center_locations"][number]) =>
  [l.address, l.colony, l.city, l.state, l.postal_code ? `CP ${l.postal_code}` : null]
    .filter(Boolean)
    .join(", ");

export default async function AdminCentrosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin
    .from("wellness_centers")
    .select(
      "id, name, contact_name, email, phone, website, services, member_benefit, status, rejection_reason, created_at, wellness_center_locations(address, colony, city, state, postal_code), center_promotions(title, discount_label, is_active, valid_until)",
    )
    .order("created_at", { ascending: true });

  const rows = ((data ?? []) as Row[]).filter(
    (c) => !estado || c.status === estado,
  );
  const pending = rows.filter((c) => c.status === "pending");
  const resolved = rows.filter((c) => c.status !== "pending");

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-[30px] md:py-[26px]">
      <h1 className="font-display text-[26px] text-ink-title">
        Centros de bienestar
      </h1>
      <FilterChips
        basePath="/admin/centros"
        current={estado}
        allLabel="Todos"
        options={[
          { value: "pending", label: "Pendientes" },
          { value: "approved", label: "Aprobados" },
          { value: "rejected", label: "Rechazados" },
        ]}
      />

      <h2 className="font-display text-lg text-ink-title">
        Solicitudes por revisar
      </h2>
      <div className="flex flex-col gap-2.5">
        {pending.map((c) => (
          <CenterReviewRow
            key={c.id}
            center={{
              id: c.id,
              name: c.name,
              services: serviceLabels(c.services ?? []),
              benefit: c.member_benefit,
              contact: [c.contact_name, c.email, c.phone]
                .filter(Boolean)
                .join(" · "),
              locations: (c.wellness_center_locations ?? []).map(locationLabel),
              applied: formatDateEs(new Date(c.created_at)),
            }}
            detailSlot={
              <DetailModal title={`Solicitud de ${c.name}`}>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <DetailItem label="CENTRO" value={c.name} />
                    <DetailItem label="CONTACTO" value={c.contact_name} />
                    <DetailItem label="CORREO" value={c.email} />
                    <DetailItem label="TELÉFONO" value={c.phone} />
                    <DetailItem
                      label="SERVICIOS"
                      value={serviceLabels(c.services ?? [])}
                    />
                    <DetailItem
                      label="BENEFICIO PARA MIEMBROS"
                      value={c.member_benefit}
                    />
                    <DetailItem
                      label="SOLICITÓ"
                      value={formatDateEs(new Date(c.created_at))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
                      UBICACIONES
                    </span>
                    {(c.wellness_center_locations ?? []).map((l, i) => (
                      <span key={i} className="text-[13px] text-ink-body">
                        📍 {locationLabel(l)}
                      </span>
                    ))}
                  </div>
                </div>
              </DetailModal>
            }
          />
        ))}
        {pending.length === 0 && (
          <div className="rounded-[18px] bg-white p-6 text-sm text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
            Sin solicitudes pendientes. 🎉
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <>
          <h2 className="font-display text-lg text-ink-title">Resueltos</h2>
          <div className="flex flex-col rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
            {resolved.map((c) => (
              <DetailModal
                key={c.id}
                title={c.name}
                trigger={
                  <div className="flex items-center gap-3 border-b border-[#F2EEE4] px-1 py-2.5 text-[13px] text-ink-body">
                    <span className="flex-1">
                      <strong className="text-ink-title">{c.name}</strong>
                      {c.wellness_center_locations?.[0]?.city
                        ? ` · ${c.wellness_center_locations[0].city}`
                        : ""}
                      {c.member_benefit ? (
                        <span className="text-ink-tertiary">
                          {" "}
                          · 🎁 {c.member_benefit}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${
                        c.status === "approved"
                          ? "bg-success-bg text-success-text"
                          : "bg-error-bg text-error-text"
                      }`}
                    >
                      {c.status === "approved" ? "APROBADO" : "RECHAZADO"}
                    </span>
                  </div>
                }
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <DetailItem label="CONTACTO" value={c.contact_name} />
                    <DetailItem label="CORREO" value={c.email} />
                    <DetailItem label="TELÉFONO" value={c.phone} />
                    <DetailItem
                      label="SITIO WEB"
                      value={
                        c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            className="font-bold text-teal-deep hover:underline"
                          >
                            {c.website} ↗
                          </a>
                        ) : null
                      }
                    />
                    <DetailItem
                      label="SERVICIOS"
                      value={serviceLabels(c.services ?? [])}
                    />
                    <DetailItem
                      label="BENEFICIO PARA MIEMBROS"
                      value={c.member_benefit}
                    />
                    <DetailItem
                      label="ESTATUS"
                      value={c.status === "approved" ? "Aprobado" : "Rechazado"}
                    />
                    <DetailItem label="MOTIVO DE RECHAZO" value={c.rejection_reason} />
                    <DetailItem
                      label="SOLICITÓ"
                      value={formatDateEs(new Date(c.created_at))}
                    />
                  </div>
                  {(c.wellness_center_locations ?? []).length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
                        SUCURSALES
                      </span>
                      {(c.wellness_center_locations ?? []).map((l, i) => (
                        <span key={i} className="text-[13px] text-ink-body">
                          📍 {locationLabel(l)}
                        </span>
                      ))}
                    </div>
                  )}
                  {(c.center_promotions ?? []).length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
                        PROMOCIONES
                      </span>
                      {(c.center_promotions ?? []).map((p, i) => (
                        <span key={i} className="text-[13px] text-ink-body">
                          🎁 {p.title}
                          {p.discount_label ? ` — ${p.discount_label}` : ""}
                          {!p.is_active ? " (inactiva)" : ""}
                          {p.valid_until
                            ? ` · vence ${formatDateEs(new Date(p.valid_until + "T00:00:00"))}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </DetailModal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
