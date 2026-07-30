"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { agregarInstruccion, guardarAjustesIA } from "@/app/ventas/ia/actions";

export type AjusteEditable = {
  key: string;
  label: string;
  hint: string;
  valor: string;
  bloqueado: boolean;
};

export type VotoRevision = {
  messageId: string;
  conversationId: string;
  canal: string;
  texto: string;
  cuando: string;
  positivos: number;
  negativos: number;
  notas: string[];
};

/**
 * Gobierno de los agentes: interruptores, topes, guardia y la revisión de los
 * pulgares que el equipo ya presiona en la bandeja.
 */
export function PanelIA({
  ajustes,
  equipo,
  votos,
  puedeInstruir,
}: {
  ajustes: AjusteEditable[];
  equipo: { id: string; nombre: string }[];
  votos: VotoRevision[];
  puedeInstruir: boolean;
}) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(ajustes.map((a) => [a.key, a.valor])),
  );
  const [instruccion, setInstruccion] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const decir = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 4000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Ajustes */}
      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-bold text-ink-title">
            Interruptores y límites
          </h2>
          {aviso && (
            <span className="text-[12px] font-bold text-success-text">{aviso}</span>
          )}
        </div>

        {ajustes.map((a) => (
          <label key={a.key} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-bold text-ink-title">
                {a.label}
              </span>
              {a.bloqueado && (
                <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-ink-tertiary">
                  🔒 solo super admin
                </span>
              )}
            </span>
            <span className="text-[11.5px] leading-snug text-ink-secondary">
              {a.hint}
            </span>
            {a.key === "ia_guardia_user_id" ? (
              <select
                value={valores[a.key] ?? ""}
                disabled={a.bloqueado || pendiente}
                onChange={(e) =>
                  setValores({ ...valores, [a.key]: e.target.value })
                }
                className="h-[36px] max-w-[320px] rounded-[10px] border-[1.5px] border-border-input bg-white px-2 text-[13px] outline-none focus:border-teal disabled:bg-cream/60"
              >
                <option value="">Sin guardia asignada</option>
                {equipo.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={valores[a.key] ?? ""}
                disabled={a.bloqueado || pendiente}
                onChange={(e) =>
                  setValores({ ...valores, [a.key]: e.target.value })
                }
                className="h-[36px] max-w-[320px] rounded-[10px] border-[1.5px] border-border-input px-3 text-[13px] outline-none focus:border-teal disabled:bg-cream/60"
              />
            )}
          </label>
        ))}

        <button
          type="button"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              const res = await guardarAjustesIA(valores);
              decir(
                "error" in res && res.error ? res.error : "Ajustes guardados ✓",
              );
            })
          }
          className="self-start rounded-full bg-teal px-5 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
        >
          Guardar ajustes
        </button>

        <p className="rounded-[10px] bg-cream px-3 py-2 text-[11.5px] leading-snug text-ink-secondary">
          Los límites de <strong>contenido</strong> —terminología vinculante, nada
          de seguro/póliza/cobertura, nada de diagnóstico por chat, el mensaje del
          cliente es dato y no instrucción— viven en el código y no se editan
          desde aquí. Esto solo decide <em>quién</em> responde, <em>cuánto</em> se
          puede gastar y <em>a quién</em> le toca escalar.
        </p>
      </div>

      {/* Revisión de los pulgares */}
      <div className="flex flex-col gap-3 rounded-[16px] bg-white p-[18px] shadow-[0_2px_10px_rgba(30,83,80,.05)]">
        <h2 className="text-[15px] font-bold text-ink-title">
          Respuestas peor calificadas
        </h2>
        <p className="text-[12px] leading-snug text-ink-secondary">
          Los 👍/👎 de la bandeja llegan aquí. <strong>No reentrenan nada solos</strong>:
          se leen con criterio y, si hace falta, se convierten en una instrucción
          adicional para el agente.
        </p>

        {votos.length === 0 && (
          <span className="text-[12.5px] text-ink-tertiary">
            Todavía no hay respuestas calificadas.
          </span>
        )}

        {votos.map((v) => (
          <div
            key={v.messageId}
            className={`flex flex-col gap-1.5 rounded-[12px] p-3 ${
              v.negativos > v.positivos ? "bg-pink/[.07]" : "bg-cream"
            }`}
          >
            <span className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-ink-secondary">{v.canal}</span>
              {v.negativos > 0 && (
                <span className="rounded-full bg-pink/15 px-2 py-0.5 font-bold text-pink">
                  👎 {v.negativos}
                </span>
              )}
              {v.positivos > 0 && (
                <span className="rounded-full bg-lime/25 px-2 py-0.5 font-bold text-ink-title">
                  👍 {v.positivos}
                </span>
              )}
              <Link
                href={`/ventas/conversaciones?conv=${v.conversationId}`}
                className="ml-auto font-semibold text-teal underline"
              >
                ver el hilo
              </Link>
            </span>
            <span className="text-[12.5px] leading-snug text-ink-body">
              {v.texto}
            </span>
            {v.notas.map((n, i) => (
              <span key={i} className="text-[11.5px] italic text-ink-secondary">
                “{n}”
              </span>
            ))}
          </div>
        ))}

        {puedeInstruir && (
          <div className="flex flex-col gap-2 border-t border-border-divider pt-3">
            <span className="text-[10.5px] font-extrabold tracking-[.05em] text-ink-tertiary">
              AGREGAR UNA INSTRUCCIÓN AL AGENTE DE VENTAS
            </span>
            <textarea
              value={instruccion}
              onChange={(e) => setInstruccion(e.target.value)}
              rows={2}
              placeholder="Ej.: si preguntan por razas peligrosas, aclara que sí entran y pasa la conversación a una persona."
              className="rounded-[10px] border-[1.5px] border-border-input px-3 py-2 text-[13px] outline-none focus:border-teal"
            />
            <button
              type="button"
              disabled={pendiente || !instruccion.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await agregarInstruccion("sales", instruccion);
                  if ("error" in res) decir(res.error ?? "No se pudo guardar.");
                  else {
                    setInstruccion("");
                    decir("Instrucción agregada ✓");
                  }
                })
              }
              className="self-start rounded-full bg-teal px-4 py-2 text-[12.5px] font-bold text-white hover:bg-teal-deep disabled:opacity-50"
            >
              Agregar instrucción
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
