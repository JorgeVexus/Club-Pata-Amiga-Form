"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

/**
 * Cambio de contraseña — compartido por los ajustes de cuenta de miembros,
 * embajadores y centros aliados. Requiere sesión activa (Supabase updateUser).
 */
export function ChangePasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(
        updateError.message.includes("different from the old")
          ? "La nueva contraseña debe ser diferente a la actual."
          : "No pudimos cambiar tu contraseña. Intenta de nuevo.",
      );
      return;
    }
    setPassword("");
    setConfirm("");
    setNotice("Contraseña actualizada ✓");
  }

  const eye = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      className="text-[13px] font-semibold text-teal-deep"
    >
      {show ? "Ocultar" : "Mostrar"}
    </button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3.5 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]"
    >
      <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
        CAMBIAR CONTRASEÑA
      </span>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <TextField
          label="Nueva contraseña"
          type={show ? "text" : "password"}
          required
          placeholder="••••••••"
          hint="Mínimo 8 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          rightSlot={eye}
        />
        <TextField
          label="Confírmala"
          type={show ? "text" : "password"}
          required
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      {error && (
        <div className="rounded-[12px] bg-error-bg px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy} className="self-start">
          {busy ? "Guardando…" : "Cambiar contraseña"}
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
