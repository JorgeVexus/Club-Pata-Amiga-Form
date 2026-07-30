import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { embudo, tarjetas } from "@/lib/tableros/metricas";
import { periodoAnterior, rangoDe } from "@/lib/tableros/rango";

/**
 * El bloque de VENTAS dentro del panel de administración — sección 7, punto 6.
 *
 * Es el principio de la sección 0 funcionando: las mismas métricas, el mismo
 * código y la misma zona horaria que el tablero de ventas. Si un número cambia
 * allá, cambia aquí — no hay dos formas de contar lo mismo.
 *
 * Muestra solo lo que un admin necesita de un vistazo (embudo compacto y cinco
 * tarjetas); lo demás vive en el portal, a un clic.
 */
export async function BloqueVentas() {
  const admin = createAdminClient();
  const rango = rangoDe("mes_actual");
  const anterior = periodoAnterior(rango, "mes_actual");

  const [filas, etapas] = await Promise.all([
    tarjetas(admin, rango, anterior),
    embudo(admin, rango),
  ]);

  const quiero = ["prospectos", "conversion", "carritos", "mrr", "sin_atender"];
  const destacadas = quiero
    .map((c) => filas.find((f) => f.clave === c))
    .filter((f): f is NonNullable<typeof f> => !!f);

  const mayor = Math.max(...etapas.map((e) => e.cuantas), 1);

  const comoTexto = (valor: number, formato: string) =>
    formato === "dinero"
      ? `$${Math.round(valor).toLocaleString("es-MX")}`
      : formato === "porcentaje"
        ? `${valor.toFixed(1)}%`
        : Math.round(valor).toLocaleString("es-MX");

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-ink-title">
          Ventas · {rango.etiqueta}
        </h2>
        <Link
          href="/ventas"
          className="text-[12.5px] font-semibold text-teal underline"
        >
          Ver el tablero completo →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {destacadas.map((t) => (
          <div
            key={t.clave}
            className="flex flex-col gap-0.5 rounded-[14px] bg-white p-3.5 shadow-[0_2px_10px_rgba(30,83,80,.05)]"
          >
            <span className="text-[9.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
              {t.etiqueta}
            </span>
            <span className="font-display text-[21px] leading-none text-ink-title">
              {t.texto ?? comoTexto(t.valor, t.formato)}
            </span>
            <span className="text-[11px] text-ink-tertiary">
              {t.variacion === null
                ? "sin comparación"
                : `${t.variacion >= 0 ? "▲" : "▼"} ${Math.abs(t.variacion).toFixed(0)}% vs ${anterior.etiqueta}`}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <span className="text-[12.5px] font-bold text-ink-title">Embudo</span>
        {etapas.map((e) => (
          <Link
            key={e.clave}
            href={`/ventas/pipelines?etapa=${e.clave}`}
            className="flex flex-col gap-1 rounded-[8px] px-1.5 py-1 hover:bg-cream/70"
          >
            <span className="flex flex-wrap items-baseline gap-2 text-[12px]">
              <span className="min-w-[140px] font-semibold text-ink-title">{e.nombre}</span>
              <span className="font-bold text-ink-title">{e.cuantas}</span>
              <span className="text-ink-secondary">
                ${Math.round(e.pesos).toLocaleString("es-MX")}
              </span>
            </span>
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-cream">
              <span
                className="block h-full rounded-full bg-teal"
                style={{ width: `${(e.cuantas / mayor) * 100}%` }}
              />
            </span>
          </Link>
        ))}
        {etapas.length === 0 && (
          <span className="text-[12px] text-ink-tertiary">
            Sin etapas configuradas todavía.
          </span>
        )}
      </div>
    </section>
  );
}
