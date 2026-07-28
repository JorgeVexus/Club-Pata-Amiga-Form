"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { descartarPareja, fusionar } from "@/app/ventas/contactos/importar/actions";

export type LadoDuplicado = {
  id: string;
  nombre: string;
  tipo: string;
  correos: string[];
  telefonos: string[];
  canales: string[];
  esMiembro: boolean;
  creado: string;
  actividades: number;
  oportunidades: number;
};

export type Pareja = {
  motivo: string;
  a: LadoDuplicado;
  b: LadoDuplicado;
};

/**
 * Revisión de posibles duplicados.
 *
 * Nunca se fusiona solo: aquí una persona decide. Se elige cuál es el registro
 * maestro —por omisión el más antiguo, que suele ser el que tiene la historia— y
 * al fusionar no se pierde nada: identidades, etiquetas, notas, tareas,
 * oportunidades y conversaciones terminan en el maestro, y queda la constancia.
 */
export function Duplicados({
  parejas,
  puedeFusionar,
}: {
  parejas: Pareja[];
  puedeFusionar: boolean;
}) {
  const [resueltas, setResueltas] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const clave = (p: Pareja) => `${p.a.id}|${p.b.id}`;
  const visibles = parejas.filter((p) => !resueltas.includes(clave(p)));

  const decir = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 5000);
  };

  const lado = (c: LadoDuplicado, esMaestro: boolean) => (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1 rounded-[12px] p-3 ${
        esMaestro ? "bg-teal/[.07] ring-[1.5px] ring-teal/40" : "bg-cream"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <Link
          href={`/ventas/contactos/${c.id}`}
          className="truncate text-[13px] font-bold text-ink-title hover:text-teal"
        >
          {c.nombre}
        </Link>
        {esMaestro && (
          <span className="flex-none rounded-full bg-teal px-2 py-0.5 text-[9.5px] font-extrabold text-white">
            MAESTRO
          </span>
        )}
      </span>
      <span className="text-[11.5px] text-ink-secondary">
        {c.tipo}
        {c.esMiembro && " · es miembro"}
      </span>
      {c.correos.map((e) => (
        <span key={e} className="truncate text-[11.5px] text-ink-body">
          ✉️ {e}
        </span>
      ))}
      {c.telefonos.map((t) => (
        <span key={t} className="text-[11.5px] text-ink-body">
          📞 {t}
        </span>
      ))}
      {c.canales.length > 0 && (
        <span className="text-[11px] text-ink-tertiary">
          canales: {c.canales.join(", ")}
        </span>
      )}
      <span className="text-[11px] text-ink-tertiary">
        {c.actividades} eventos · {c.oportunidades} oportunidad(es) · desde {c.creado}
      </span>
    </div>
  );

  if (visibles.length === 0)
    return (
      <p className="rounded-[16px] bg-white px-5 py-12 text-center text-[13.5px] text-ink-secondary shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        {parejas.length === 0
          ? "No hay posibles duplicados. 🐾"
          : "Listo: no queda nada por revisar."}
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      {aviso && (
        <span className="text-[12.5px] font-bold text-success-text">{aviso}</span>
      )}
      {visibles.map((p) => {
        // Maestro por omisión: el más antiguo (suele traer la historia). Si uno
        // es miembro de la plataforma, ese gana.
        const maestroEsA = p.a.esMiembro
          ? true
          : p.b.esMiembro
            ? false
            : p.a.creado <= p.b.creado;
        const maestro = maestroEsA ? p.a : p.b;
        const otro = maestroEsA ? p.b : p.a;

        return (
          <div
            key={clave(p)}
            className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]"
          >
            <span className="text-[11.5px] font-bold text-orange">
              ⚠️ {p.motivo}
            </span>
            <div className="flex flex-col gap-2 md:flex-row">
              {lado(maestro, true)}
              {lado(otro, false)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {puedeFusionar ? (
                <>
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await fusionar(maestro.id, [otro.id]);
                        if ("error" in res) decir(res.error ?? "No se pudo fusionar.");
                        else {
                          decir(
                            `Fusionados en "${maestro.nombre}" — se movieron ${res.movido.identidades} identidad(es), ${res.movido.actividades} eventos y ${res.movido.oportunidades} oportunidad(es) ✓`,
                          );
                          setResueltas((r) => [...r, clave(p)]);
                        }
                      })
                    }
                    className="rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
                  >
                    Fusionar en {maestro.nombre}
                  </button>
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await fusionar(otro.id, [maestro.id]);
                        if ("error" in res) decir(res.error ?? "No se pudo fusionar.");
                        else {
                          decir(`Fusionados en "${otro.nombre}" ✓`);
                          setResueltas((r) => [...r, clave(p)]);
                        }
                      })
                    }
                    className="rounded-full border-[1.5px] border-border-input bg-white px-4 py-2 text-[12.5px] font-bold text-teal-deep transition-colors hover:border-teal disabled:opacity-50"
                  >
                    Al revés (maestro: {otro.nombre})
                  </button>
                </>
              ) : (
                <span className="text-[12px] text-ink-tertiary">
                  Fusionar lo hace el gerente de ventas.
                </span>
              )}
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  startTransition(async () => {
                    await descartarPareja(maestro.id, otro.id);
                    decir("Marcado: no son la misma persona ✓");
                    setResueltas((r) => [...r, clave(p)]);
                  })
                }
                className="text-[12px] font-semibold text-ink-tertiary underline"
              >
                No son la misma persona
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
