import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-guard";
import { bankFromClabe, csvCell } from "@/lib/banks";
import { inicioDelMes } from "@/lib/zona-horaria";

/**
 * Layout bancario (CSV) para dispersar los reintegros aprobados del mes:
 * una fila por solicitud aprobada/parcial con CLABE del miembro. Se sube al
 * portal del banco para transferencias masivas (SPEI) dentro de las 72 hrs.
 */
export async function GET() {
  const ctx = await requireAdminRoute();
  if (!ctx) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  // El corte del mes es el mexicano: este CSV se sube al banco y define a quién
  // se le paga, así que no puede depender de dónde corrió el proceso.
  const monthStart = inicioDelMes();

  const { data } = await ctx.admin
    .from("reimbursements")
    .select(
      "folio, amount_approved, clabe, resolved_at, profiles!user_id(first_name, last_name, email)",
    )
    .in("status", ["approved", "partial"])
    .gte("resolved_at", monthStart.toISOString())
    .order("resolved_at", { ascending: true });

  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  const header = "CLABE,BENEFICIARIO,BANCO,MONTO,CONCEPTO,CORREO";
  const lines = (data ?? []).map((r) => {
    const p = one(r.profiles) as {
      first_name?: string;
      last_name?: string;
      email?: string;
    } | null;
    return [
      csvCell(r.clabe ?? "SIN CLABE — solicitar al miembro"),
      csvCell(
        `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim().toUpperCase() ||
          "MIEMBRO",
      ),
      csvCell(r.clabe ? (bankFromClabe(r.clabe) ?? "") : ""),
      Number(r.amount_approved ?? 0).toFixed(2),
      csvCell(`REINTEGRO ${r.folio}`),
      csvCell(p?.email ?? ""),
    ].join(",");
  });

  const period = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  return new NextResponse("﻿" + [header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="layout-reintegros-${period.replace(/\s/g, "-")}.csv"`,
    },
  });
}
