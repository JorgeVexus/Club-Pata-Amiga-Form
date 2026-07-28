import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePortal } from "@/lib/panel-guard";
import { candidatosDuplicados } from "@/lib/crm/merge";
import { formatDateEs } from "@/lib/dates";
import {
  Duplicados,
  type LadoDuplicado,
  type Pareja,
} from "@/components/panel/contactos/Duplicados";

export const metadata = { title: "Posibles duplicados · Portal de ventas" };

export default async function DuplicadosPage() {
  const session = await requirePortal("ventas");
  const admin = createAdminClient();

  const candidatos = await candidatosDuplicados(admin);
  const ids = [...new Set(candidatos.flatMap((p) => [p.a, p.b]))];

  const parejas: Pareja[] = [];
  if (ids.length > 0) {
    const [{ data: contactos }, { data: actividades }, { data: oportunidades }] =
      await Promise.all([
        admin
          .from("contacts")
          .select(
            "id, first_name, last_name, contact_type, profile_id, created_at, custom_fields, contact_identities(kind, value)",
          )
          .in("id", ids),
        admin.from("contact_activities").select("contact_id").in("contact_id", ids),
        admin.from("opportunities").select("contact_id").in("contact_id", ids),
      ]);

    const conteo = (filas: { contact_id: string }[] | null, id: string) =>
      (filas ?? []).filter((f) => f.contact_id === id).length;

    const porId = new Map<string, LadoDuplicado>();
    const descartes = new Map<string, string[]>();

    for (const c of contactos ?? []) {
      const idents = (c.contact_identities ?? []) as { kind: string; value: string }[];
      porId.set(c.id, {
        id: c.id,
        nombre:
          [c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre",
        tipo: c.contact_type,
        correos: idents.filter((i) => i.kind === "email").map((i) => i.value),
        telefonos: idents.filter((i) => i.kind === "phone").map((i) => i.value),
        canales: [
          ...new Set(
            idents
              .filter((i) => !["email", "phone"].includes(i.kind))
              .map((i) => i.kind),
          ),
        ],
        esMiembro: !!c.profile_id,
        creado: formatDateEs(c.created_at),
        actividades: conteo(actividades, c.id),
        oportunidades: conteo(oportunidades, c.id),
      });

      const campos = (c.custom_fields as Record<string, unknown>) ?? {};
      if (Array.isArray(campos.__no_duplicado_de))
        descartes.set(c.id, campos.__no_duplicado_de as string[]);
    }

    for (const cand of candidatos) {
      const a = porId.get(cand.a);
      const b = porId.get(cand.b);
      if (!a || !b) continue; // alguno ya se fusionó o se borró
      // Parejas que una persona ya marcó como "no son la misma"
      if (
        descartes.get(cand.a)?.includes(cand.b) ||
        descartes.get(cand.b)?.includes(cand.a)
      )
        continue;
      parejas.push({ motivo: cand.motivo, a, b });
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-[30px] md:py-[26px]">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/ventas/contactos"
          className="text-[13px] font-semibold text-ink-tertiary hover:text-teal"
        >
          ← Contactos
        </Link>
        <h1 className="font-display text-[24px] text-ink-title">
          Posibles duplicados{" "}
          <span className="text-[15px] font-semibold text-ink-tertiary">
            {parejas.length}
          </span>
        </h1>
      </div>

      <p className="text-[12.5px] leading-snug text-ink-secondary">
        La plataforma <strong>nunca</strong> une dos contactos por su cuenta
        cuando solo comparten el teléfono o el nombre: mezclar dos clientes
        distintos es peor que tener dos registros del mismo. Aquí decide una
        persona. Al fusionar no se pierde nada — identidades, etiquetas, notas,
        tareas, oportunidades y conversaciones pasan al maestro y queda la
        constancia en su historial.
      </p>

      <Duplicados
        parejas={parejas}
        puedeFusionar={session.can["contactos.fusionar"]}
      />
    </div>
  );
}
