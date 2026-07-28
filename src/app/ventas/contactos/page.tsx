import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { uno } from "@/lib/crm/embed";
import {
  ContactosTabla,
  type FilaContacto,
} from "@/components/panel/contactos/ContactosTabla";

export const metadata = { title: "Contactos · Portal de ventas" };

const TIPOS = [
  { value: "lead", label: "Leads" },
  { value: "miembro", label: "Miembros" },
  { value: "embajador", label: "Embajadores" },
  { value: "centro", label: "Centros" },
];

const POR_PAGINA = 50;

/** Quita lo que rompería un filtro de PostgREST (comas y paréntesis). */
function limpiarBusqueda(q: string) {
  return q.replace(/[(),*]/g, " ").trim().slice(0, 80);
}

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requirePortal("ventas");
  const params = await searchParams;
  const admin = createAdminClient();

  const q = limpiarBusqueda(params.q ?? "");
  const tipo = params.tipo ?? "";
  const propietario = params.propietario ?? "";
  const etiqueta = params.etiqueta ?? "";
  const orden = params.orden ?? "actividad";
  const pagina = Math.max(1, Number(params.pagina ?? "1") || 1);

  // Catálogos para los filtros y las acciones en lote
  const [{ data: etiquetasCat }, { data: equipoCat }, { data: vistas }] =
    await Promise.all([
      admin.from("tags").select("id, name").order("name"),
      admin
        .from("profiles")
        .select("id, first_name, email, role")
        .in("role", ["ventas", "gerente_ventas", "admin", "super_admin"])
        .order("first_name"),
      admin
        .from("saved_views")
        .select("id, name, filters, owner_id")
        .eq("kind", "contactos")
        .order("position"),
    ]);

  const equipo = (equipoCat ?? []).map((m) => ({
    id: m.id,
    nombre: m.first_name || m.email?.split("@")[0] || "Equipo",
  }));

  // Búsqueda: primero por identidad (correo, teléfono, id de canal), porque es
  // como el equipo busca de verdad; el nombre se suma con un OR.
  let idsPorIdentidad: string[] = [];
  if (q) {
    const { data } = await admin
      .from("contact_identities")
      .select("contact_id")
      .ilike("value", `%${q}%`)
      .limit(200);
    idsPorIdentidad = [...new Set((data ?? []).map((r) => r.contact_id))];
  }

  let consulta = admin
    .from("contacts")
    .select(
      `id, first_name, last_name, contact_type, source, owner_id, dnd, last_activity_at, profile_id,
       contact_identities(kind, value, is_primary),
       contact_tags(tag_id, tags(id, name, color))`,
      { count: "exact" },
    );

  if (tipo) consulta = consulta.eq("contact_type", tipo);
  if (propietario === "sin")
    consulta = consulta.is("owner_id", null);
  else if (propietario === "mios") consulta = consulta.eq("owner_id", session.userId);
  else if (propietario) consulta = consulta.eq("owner_id", propietario);

  if (q) {
    const partes = [
      `first_name.ilike.%${q}%`,
      `last_name.ilike.%${q}%`,
      ...(idsPorIdentidad.length > 0
        ? [`id.in.(${idsPorIdentidad.join(",")})`]
        : []),
    ];
    consulta = consulta.or(partes.join(","));
  }

  consulta =
    orden === "nombre"
      ? consulta.order("first_name", { ascending: true, nullsFirst: false })
      : orden === "creado"
        ? consulta.order("created_at", { ascending: false })
        : consulta.order("last_activity_at", {
            ascending: false,
            nullsFirst: false,
          });

  const desde = (pagina - 1) * POR_PAGINA;
  const { data: rows, count } = await consulta.range(desde, desde + POR_PAGINA - 1);

  const propietariosPorId = new Map(equipo.map((m) => [m.id, m.nombre]));

  let filas: FilaContacto[] = (rows ?? []).map((c) => {
    const ids = (c.contact_identities ?? []) as {
      kind: string;
      value: string;
      is_primary: boolean;
    }[];
    const tags = (c.contact_tags ?? []).flatMap((t) => {
      const tag = uno(t.tags);
      return tag ? [tag] : [];
    });

    return {
      id: c.id,
      nombre:
        [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre",
      tipo: c.contact_type,
      correo: ids.find((i) => i.kind === "email")?.value ?? null,
      telefono: ids.find((i) => i.kind === "phone")?.value ?? null,
      canales: [...new Set(ids.map((i) => i.kind))],
      etiquetas: tags,
      propietario: c.owner_id ? propietariosPorId.get(c.owner_id) ?? "—" : null,
      fuente: c.source,
      ultimaActividad: c.last_activity_at,
      dnd: Object.keys((c.dnd as Record<string, boolean>) ?? {}),
      esMiembro: !!c.profile_id,
    };
  });

  // La etiqueta se filtra aquí porque PostgREST no permite filtrar por la tabla
  // embebida sin perder el conteo total.
  if (etiqueta) filas = filas.filter((f) => f.etiquetas.some((t) => t.id === etiqueta));

  const total = count ?? filas.length;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const qs = (extra: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, tipo, propietario, etiqueta, orden, ...extra }))
      if (v) sp.set(k, v);
    return `/ventas/contactos${sp.toString() ? `?${sp}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[26px] text-ink-title">
          Contactos{" "}
          <span className="text-[15px] font-semibold text-ink-tertiary">
            {total.toLocaleString("es-MX")}
          </span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ventas/contactos/duplicados"
            className="grid h-[42px] place-items-center rounded-full border-[1.5px] border-border-input bg-white px-5 text-[13px] font-bold text-teal-deep transition-colors hover:border-teal"
          >
            🔗 Duplicados
          </Link>
          <Link
            href="/ventas/contactos/importar"
            className="grid h-[42px] place-items-center rounded-full border-[1.5px] border-border-input bg-white px-5 text-[13px] font-bold text-teal-deep transition-colors hover:border-teal"
          >
            ⬆️ Importar CSV
          </Link>
          <a
            href={`/api/admin/crm/contactos.csv${qs({}).includes("?") ? "?" + qs({}).split("?")[1] : ""}`}
            className="grid h-[42px] place-items-center rounded-full border-[1.5px] border-border-input bg-white px-5 text-[13px] font-bold text-teal-deep transition-colors hover:border-teal"
          >
            ⬇️ Exportar CSV
          </a>
        </div>
      </div>

      {/* Vistas guardadas: son filtros, no copias de contactos */}
      {(vistas ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(vistas ?? []).map((v) => {
            const sp = new URLSearchParams(
              v.filters as Record<string, string>,
            ).toString();
            return (
              <Link
                key={v.id}
                href={`/ventas/contactos${sp ? `?${sp}` : ""}`}
                className="rounded-full border-[1.5px] border-border-input bg-white px-3.5 py-[6px] text-[12px] font-semibold text-ink-secondary transition-colors hover:border-teal"
              >
                {v.owner_id ? "🔒" : "👥"} {v.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Filtros — sin JS: un form que escribe la querystring */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-2.5 rounded-[16px] bg-white p-4 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
      >
        <label className="flex min-w-[210px] flex-1 flex-col gap-1">
          <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
            BUSCAR
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre, correo, teléfono, id de canal…"
            className="h-[40px] rounded-[10px] border-[1.5px] border-border-input px-3 text-[13px] text-ink-title outline-none focus:border-teal"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
            TIPO
          </span>
          <select
            name="tipo"
            defaultValue={tipo}
            className="h-[40px] rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[13px] text-ink-title outline-none focus:border-teal"
          >
            <option value="">Todos</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
            PROPIETARIO
          </span>
          <select
            name="propietario"
            defaultValue={propietario}
            className="h-[40px] rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[13px] text-ink-title outline-none focus:border-teal"
          >
            <option value="">Cualquiera</option>
            <option value="mios">Míos</option>
            <option value="sin">Sin asignar</option>
            {equipo.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
            ETIQUETA
          </span>
          <select
            name="etiqueta"
            defaultValue={etiqueta}
            className="h-[40px] rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[13px] text-ink-title outline-none focus:border-teal"
          >
            <option value="">Cualquiera</option>
            {(etiquetasCat ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
            ORDEN
          </span>
          <select
            name="orden"
            defaultValue={orden}
            className="h-[40px] rounded-[10px] border-[1.5px] border-border-input bg-white px-3 text-[13px] text-ink-title outline-none focus:border-teal"
          >
            <option value="actividad">Actividad reciente</option>
            <option value="nombre">Nombre</option>
            <option value="creado">Más nuevos</option>
          </select>
        </label>
        <button
          type="submit"
          className="grid h-[40px] place-items-center rounded-full bg-teal px-5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep"
        >
          Filtrar
        </button>
        <Link
          href="/ventas/contactos"
          className="grid h-[40px] place-items-center px-2 text-[12.5px] font-semibold text-ink-tertiary underline"
        >
          Limpiar
        </Link>
      </form>

      <ContactosTabla
        filas={filas}
        etiquetas={etiquetasCat ?? []}
        equipo={equipo}
        puedeEditar={session.can["contactos.editar"]}
      />

      {paginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          {pagina > 1 && (
            <Link
              href={qs({ pagina: String(pagina - 1) })}
              className="rounded-full border-[1.5px] border-border-input bg-white px-4 py-2 text-[12.5px] font-bold text-teal-deep"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-[12.5px] text-ink-tertiary">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <Link
              href={qs({ pagina: String(pagina + 1) })}
              className="rounded-full border-[1.5px] border-border-input bg-white px-4 py-2 text-[12.5px] font-bold text-teal-deep"
            >
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
