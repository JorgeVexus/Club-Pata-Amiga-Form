"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveCenter } from "@/app/admin/actions";

export function CenterReviewRow({
  center,
  detailSlot,
}: {
  detailSlot?: React.ReactNode;
  center: {
    id: string;
    name: string;
    services: string;
    benefit: string | null;
    contact: string;
    locations: string[];
    applied: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function run(decision: Parameters<typeof resolveCenter>[1]) {
    startTransition(async () => {
      await resolveCenter(center.id, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink-title">
            {center.name}
          </span>
          <span className="rounded-full bg-info-bg px-2.5 py-[3px] text-[10.5px] font-extrabold text-info-text">
            {center.services}
          </span>
        </div>
        {center.benefit && (
          <span className="text-xs font-semibold text-warning-text">
            🎁 {center.benefit}
          </span>
        )}
        <span className="text-xs text-ink-tertiary">
          {center.contact} · solicitó el {center.applied}
        </span>
        {center.locations.map((loc, i) => (
          <span key={i} className="text-xs text-ink-secondary">
            📍 {loc}
          </span>
        ))}
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
        <div className="flex w-full gap-2">
          <input
            autoFocus
            placeholder="Motivo para el centro"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-full border-[1.5px] border-border-input px-4 text-[13px] text-ink-title outline-none focus:border-teal"
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
