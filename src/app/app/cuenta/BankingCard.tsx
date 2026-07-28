"use client";

import { useState } from "react";
import { BANK_OPTIONS, bankFromClabe } from "@/lib/banks";
import { SelectField, TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { saveMemberBanking } from "./actions";

/**
 * Datos bancarios del miembro (SPEI para reintegros). El banco se detecta
 * automáticamente desde la CLABE y puede corregirse con el selector.
 */
export function BankingCard({
  initialBank,
  initialClabe,
}: {
  initialBank: string | null;
  initialClabe: string | null;
}) {
  const [bank, setBank] = useState(initialBank ?? "");
  const [clabe, setClabe] = useState(initialClabe ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await saveMemberBanking(bank, clabe);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.bankName) setBank(result.bankName);
    setNotice("Datos bancarios guardados ✓");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3.5 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]"
    >
      <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
        DATOS BANCARIOS
      </span>
      <p className="-mt-1 text-[13px] leading-normal text-ink-secondary">
        Tus reintegros se transfieren por SPEI a esta cuenta. La usamos para
        prellenar cada solicitud.
      </p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <TextField
          label="CLABE (18 dígitos)"
          inputMode="numeric"
          placeholder="000 000 00000000000 0"
          value={clabe}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 18);
            setClabe(digits);
            const detected = bankFromClabe(digits);
            if (detected) setBank(detected);
          }}
        />
        <SelectField
          label="Banco"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        >
          <option value="">Selecciona tu banco</option>
          {BANK_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </SelectField>
      </div>
      {error && (
        <div className="rounded-[12px] bg-error-bg px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy} className="self-start">
          {busy ? "Guardando…" : "Guardar datos bancarios"}
        </Button>
        {notice && (
          <span className="text-sm font-semibold text-success-text">
            {notice}
          </span>
        )}
      </div>
    </form>
  );
}
