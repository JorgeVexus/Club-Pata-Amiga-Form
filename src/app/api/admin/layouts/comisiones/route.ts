import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-guard";
import { bankFromClabe, csvCell } from "@/lib/banks";
import { inicioDelMes } from "@/lib/zona-horaria";

/**
 * Layout bancario (CSV) para la dispersión del corte mensual de comisiones:
 * suma por embajador de los referidos pendientes generados antes del mes en
 * curso. Se sube al portal del banco para transferencias masivas (SPEI).
 * Los embajadores sin CLABE registrada aparecen marcados para seguimiento.
 */
export async function GET() {
  const ctx = await requireAdminRoute();
  if (!ctx) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  // El corte del mes es el mexicano: este CSV se sube al banco y define a quién
  // se le paga, así que no puede depender de dónde corrió el proceso.
  const monthStart = inicioDelMes();

  const { data } = await ctx.admin
    .from("ambassadors")
    .select(
      "first_name, last_name, email, bank_name, clabe, referral_code, referrals(commission_amount, status, created_at)",
    )
    .eq("status", "approved");

  const rows = (data ?? [])
    .map((a) => {
      const total = (a.referrals ?? [])
        .filter(
          (r: { status: string; created_at: string }) =>
            r.status === "pending" && new Date(r.created_at) < monthStart,
        )
        .reduce(
          (sum: number, r: { commission_amount: number | null }) =>
            sum + Number(r.commission_amount ?? 0),
          0,
        );
      return { a, total };
    })
    .filter(({ total }) => total > 0);

  const header = "CLABE,BENEFICIARIO,BANCO,MONTO,CONCEPTO,CORREO";
  const lines = rows.map(({ a, total }) =>
    [
      csvCell(a.clabe ?? "SIN CLABE — solicitar al embajador"),
      csvCell(`${a.first_name} ${a.last_name ?? ""}`.trim().toUpperCase()),
      csvCell(a.bank_name ?? (a.clabe ? (bankFromClabe(a.clabe) ?? "") : "")),
      total.toFixed(2),
      csvCell(`COMISION PATA AMIGA ${a.referral_code ?? ""}`.trim()),
      csvCell(a.email),
    ].join(","),
  );

  const period = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  // BOM para que Excel abra el CSV con acentos correctos
  return new NextResponse("﻿" + [header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="layout-comisiones-${period.replace(/\s/g, "-")}.csv"`,
    },
  });
}
