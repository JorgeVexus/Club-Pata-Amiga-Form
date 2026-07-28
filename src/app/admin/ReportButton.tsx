"use client";

import { useState, useTransition } from "react";
import { sendReport } from "./actions";

/**
 * Envía por correo el reporte de métricas (armado en el servidor con datos
 * vivos) a los destinatarios configurados en Sitio web → Notificaciones.
 */
export function ReportButton({ report }: { report: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {status && (
        <span className="text-xs font-semibold text-success-text">
          {status}
        </span>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setStatus(null);
            const result = await sendReport(report);
            setStatus(
              result.error ??
                `Enviado a ${result.to} destinatario${result.to === 1 ? "" : "s"} ✓`,
            );
            setTimeout(() => setStatus(null), 4000);
          })
        }
        className="grid h-[42px] place-items-center whitespace-nowrap rounded-full bg-teal px-5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
      >
        {pending ? "Enviando…" : "✉️ Enviar reporte"}
      </button>
    </div>
  );
}
