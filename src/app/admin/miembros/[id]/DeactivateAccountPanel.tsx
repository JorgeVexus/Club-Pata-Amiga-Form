"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateMemberAccount } from "@/app/admin/actions";

/**
 * Dar de baja la cuenta de un miembro — visible SOLO para el super admin
 * (regla del sitio vivo). Cancela la membresía de inmediato y avisa al
 * miembro por correo y notificación.
 */
export function DeactivateAccountPanel({
  userId,
  memberName,
}: {
  userId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] border-[1.5px] border-[#F2C7D4] bg-white p-5">
      <span className="text-[11px] font-extrabold tracking-[.06em] text-error-text">
        ZONA DE BAJA (SOLO SUPER ADMIN)
      </span>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-full border-[1.5px] border-[#F2C7D4] px-4 py-2 text-[12.5px] font-bold text-error-text transition-colors hover:bg-error-bg"
        >
          Dar de baja la cuenta…
        </button>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            La membresía de <strong>{memberName}</strong> se cancela de
            inmediato (también en Stripe) y recibirá el aviso por correo
            (plantilla editable en Comunicados).
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Motivo de la baja (se incluye en el aviso al miembro)…"
            className="rounded-[12px] border-[1.5px] border-border-input p-3 text-sm text-ink-body outline-none focus:border-teal"
          />
          {error && (
            <span className="text-xs font-semibold text-error-text">
              {error}
            </span>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border-[1.5px] border-border-input px-4 py-2 text-[12.5px] font-bold text-ink-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy || reason.trim().length < 5}
              onClick={async () => {
                setBusy(true);
                setError(null);
                const result = await deactivateMemberAccount(userId, reason);
                setBusy(false);
                if (result.error) setError(result.error);
                else router.refresh();
              }}
              className="rounded-full bg-error-text px-4 py-2 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Procesando…" : "Confirmar baja"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
