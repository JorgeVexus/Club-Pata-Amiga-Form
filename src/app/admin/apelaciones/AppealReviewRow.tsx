"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveAppeal } from "@/app/admin/actions";

export function AppealReviewRow({
  appeal,
  detailSlot,
}: {
  detailSlot?: React.ReactNode;
  appeal: {
    id: string;
    folio: string;
    subject: string;
    originalDecision: string;
    member: string;
    message: string;
    submitted: string;
    detailHref: string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");

  function run(decision: Parameters<typeof resolveAppeal>[1]) {
    startTransition(async () => {
      await resolveAppeal(appeal.id, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-teal-deep">{appeal.folio}</span>
          <span className="text-sm font-bold text-ink-title">
            {appeal.subject}
          </span>
          {appeal.detailHref && (
            <a
              href={appeal.detailHref}
              className="text-xs font-bold text-teal-deep hover:underline"
            >
              Ver expediente →
            </a>
          )}
        </div>
        <span className="text-xs text-ink-tertiary">
          {appeal.member} · presentada el {appeal.submitted}
        </span>
        <span className="text-xs text-ink-secondary">
          <strong>Decisión original:</strong> {appeal.originalDecision}
        </span>
        <p className="mt-1 rounded-[12px] bg-cream px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-body">
          “{appeal.message}”
        </p>
        {detailSlot && <div className="mt-1.5">{detailSlot}</div>}
      </div>
      {!rejecting ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run({ accept: true })}
            className="grid h-10 place-items-center rounded-full bg-teal px-5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
          >
            ✓ Aceptar apelación
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setRejecting(true)}
            className="grid h-10 place-items-center rounded-full border-[1.5px] border-[#F2C7D4] px-5 text-[13px] font-semibold text-error-text transition-colors hover:bg-error-bg"
          >
            Mantener decisión…
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run({ close: true })}
            title="Cerrar el caso sin reabrir nada (exclusivo del super admin)"
            className="grid h-10 place-items-center rounded-full border-[1.5px] border-border-input px-5 text-[13px] font-semibold text-ink-secondary transition-colors hover:border-ink-tertiary"
          >
            Cerrar caso
          </button>
        </div>
      ) : (
        <div className="flex w-full gap-2">
          <input
            autoFocus
            placeholder="Explicación para el miembro"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-full border-[1.5px] border-border-input px-4 text-[13px] text-ink-title outline-none focus:border-teal"
          />
          <button
            type="button"
            disabled={pending || notes.trim().length === 0}
            onClick={() => run({ accept: false, notes: notes.trim() })}
            className="grid h-10 flex-none place-items-center rounded-full bg-error-text px-4 text-[13px] font-bold text-white disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
