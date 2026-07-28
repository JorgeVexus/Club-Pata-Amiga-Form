"use client";

import { useState } from "react";
import {
  USO_CFDI_OPTIONS,
  REGIMEN_FISCAL_OPTIONS,
  isPersonaMoral,
} from "@/lib/cfdi";
import { saveBillingData } from "./actions";

export type BillingData = {
  cfdiRequested: boolean;
  rfc: string | null;
  razonSocial: string | null;
  regimenFiscal: string | null;
  usoCfdi: string | null;
  cpFiscal: string | null;
};

/**
 * Facturación (CFDI 4.0) — el miembro registra sus datos fiscales una vez
 * y el equipo emite la factura de cada cobro (BillingModal del sistema
 * anterior, ahora en Mi cuenta).
 */
export function BillingCard({ initial }: { initial: BillingData }) {
  const [wants, setWants] = useState(initial.cfdiRequested);
  const [editing, setEditing] = useState(false);
  const [rfc, setRfc] = useState(initial.rfc ?? "");
  const [razon, setRazon] = useState(initial.razonSocial ?? "");
  const [regimen, setRegimen] = useState(initial.regimenFiscal ?? "");
  const [uso, setUso] = useState(initial.usoCfdi ?? "G03");
  const [cp, setCp] = useState(initial.cpFiscal ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const moral = isPersonaMoral(rfc);

  const toggle = async (next: boolean) => {
    setWants(next);
    setNotice(null);
    if (!next) {
      await saveBillingData({ wantsInvoice: false });
      setEditing(false);
      setNotice("Listo — no emitiremos facturas para tus pagos.");
    } else {
      setEditing(!initial.rfc);
    }
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await saveBillingData({
        wantsInvoice: true,
        rfc,
        razonSocial: razon,
        regimenFiscal: regimen,
        usoCfdi: uso,
        cpFiscal: cp,
      });
      if (result.error) setError(result.error);
      else {
        setEditing(false);
        setNotice("Datos fiscales guardados. Emitiremos tu CFDI en cada cobro.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
          FACTURACIÓN (CFDI)
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={wants}
          onClick={() => toggle(!wants)}
          className={`relative h-6 w-11 rounded-full transition-colors ${wants ? "bg-teal" : "bg-border-input"}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${wants ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>

      {!wants ? (
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          ¿Necesitas factura? Activa el interruptor y registra tus datos
          fiscales una sola vez.
        </p>
      ) : !editing ? (
        <div className="flex flex-col gap-1 text-sm text-ink-body">
          <span className="font-bold text-ink-title">{razon || "—"}</span>
          <span>
            RFC {rfc || "—"} · Régimen {regimen || "—"} · Uso {uso} · CP{" "}
            {cp || "—"}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 self-start text-[13px] font-semibold text-teal-deep"
          >
            Editar datos fiscales →
          </button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-semibold text-ink-title">
                RFC
                {moral != null && (
                  <span className="ml-2 rounded-full bg-info-bg px-2 py-0.5 text-[10px] font-extrabold text-info-text">
                    {moral ? "PERSONA MORAL" : "PERSONA FÍSICA"}
                  </span>
                )}
              </span>
              <input
                value={rfc}
                onChange={(e) =>
                  setRfc(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 13))
                }
                placeholder="12 o 13 caracteres"
                className="h-11 rounded-[12px] border-[1.5px] border-border-input px-3.5 text-sm tracking-wide text-ink-title outline-none focus:border-teal"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-semibold text-ink-title">
                CP fiscal
              </span>
              <input
                value={cp}
                onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                inputMode="numeric"
                placeholder="5 dígitos"
                className="h-11 rounded-[12px] border-[1.5px] border-border-input px-3.5 text-sm text-ink-title outline-none focus:border-teal"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] font-semibold text-ink-title">
              Razón social (sin régimen societario, como en tu constancia)
            </span>
            <input
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              className="h-11 rounded-[12px] border-[1.5px] border-border-input px-3.5 text-sm text-ink-title outline-none focus:border-teal"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-semibold text-ink-title">
                Régimen fiscal
              </span>
              <select
                value={regimen}
                onChange={(e) => setRegimen(e.target.value)}
                className="h-11 appearance-none rounded-[12px] border-[1.5px] border-border-input bg-white px-3.5 text-sm text-ink-title outline-none focus:border-teal"
              >
                <option value="">Selecciona…</option>
                {REGIMEN_FISCAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-semibold text-ink-title">
                Uso del CFDI
              </span>
              <select
                value={uso}
                onChange={(e) => setUso(e.target.value)}
                className="h-11 appearance-none rounded-[12px] border-[1.5px] border-border-input bg-white px-3.5 text-sm text-ink-title outline-none focus:border-teal"
              >
                {USO_CFDI_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <span className="text-xs font-semibold text-error-text">{error}</span>
          )}
          <button
            type="submit"
            disabled={busy}
            className="grid h-11 place-items-center self-start rounded-full bg-teal px-6 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
          >
            {busy ? "Guardando…" : "Guardar datos fiscales"}
          </button>
        </form>
      )}
      {notice && (
        <span className="text-xs font-semibold text-success-text">{notice}</span>
      )}
    </section>
  );
}
