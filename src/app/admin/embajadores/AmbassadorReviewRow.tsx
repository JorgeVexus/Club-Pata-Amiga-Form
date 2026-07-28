"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveAmbassador } from "@/app/admin/actions";

export function AmbassadorReviewRow({
  ambassador,
  detailSlot,
}: {
  detailSlot?: React.ReactNode;
  ambassador: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    curp: string | null;
    location: string;
    hasAccount: boolean;
    applied: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function run(decision: Parameters<typeof resolveAmbassador>[1]) {
    startTransition(async () => {
      await resolveAmbassador(ambassador.id, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(30,83,80,.05)] sm:flex-row sm:items-center">
      <div className="grid size-14 flex-none place-items-center rounded-full bg-warning-bg text-lg font-extrabold text-warning-text">
        {ambassador.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-bold text-ink-title">
          {ambassador.name}
          {ambassador.location ? ` · ${ambassador.location}` : ""}
        </span>
        <span className="text-xs text-ink-tertiary">
          {ambassador.email}
          {ambassador.phone ? ` · ${ambassador.phone}` : ""} · solicitó el{" "}
          {ambassador.applied}
        </span>
        <span className="text-xs font-semibold">
          <span
            className={
              ambassador.curp ? "text-success-text" : "text-warning-text"
            }
          >
            CURP {ambassador.curp ? `${ambassador.curp} ✓` : "pendiente"}
          </span>
          {" · "}
          <span
            className={
              ambassador.hasAccount ? "text-success-text" : "text-ink-tertiary"
            }
          >
            {ambassador.hasAccount ? "con cuenta vinculada" : "sin cuenta aún"}
          </span>
        </span>
        {detailSlot && <div className="mt-1.5">{detailSlot}</div>}
      </div>
      {!rejecting ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run({ approve: true })}
            className="grid h-10 place-items-center rounded-full bg-teal px-5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
          >
            ✓ Aprobar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setRejecting(true)}
            className="grid h-10 place-items-center rounded-full border-[1.5px] border-[#F2C7D4] px-5 text-[13px] font-semibold text-error-text transition-colors hover:bg-error-bg"
          >
            Rechazar…
          </button>
        </div>
      ) : (
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            autoFocus
            placeholder="Motivo para el solicitante"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-full border-[1.5px] border-border-input px-4 text-[13px] text-ink-title outline-none focus:border-teal sm:w-64"
          />
          <button
            type="button"
            disabled={pending || reason.trim().length === 0}
            onClick={() => run({ approve: false, reason: reason.trim() })}
            className="grid h-10 flex-none place-items-center rounded-full bg-error-text px-4 text-[13px] font-bold text-white disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
