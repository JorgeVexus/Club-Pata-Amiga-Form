"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendReimbursementMessage } from "@/app/admin/actions";

type Msg = {
  id: string;
  sender: "admin" | "member";
  message: string;
  created_at: string;
};

/**
 * Conversación comité↔miembro de ESTE reintegro. El miembro solo ve el hilo
 * en su detalle cuando el comité escribe primero (conversaciones separadas
 * por área).
 */
export function ThreadPanel({
  reimbursementId,
  thread,
}: {
  reimbursementId: string;
  thread: Msg[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-white p-5 shadow-[0_2px_10px_rgba(30,83,80,.05)]">
      <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
        CONVERSACIÓN CON EL MIEMBRO
      </span>
      {thread.length > 0 ? (
        <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
          {thread.map((m) => (
            <div
              key={m.id}
              className={`flex max-w-[85%] flex-col gap-0.5 rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.sender === "admin"
                  ? "self-end bg-info-bg text-ink-body"
                  : "self-start bg-cream text-ink-body"
              }`}
            >
              <span className="text-[10px] font-extrabold tracking-wide text-ink-tertiary">
                {m.sender === "admin" ? "COMITÉ" : "MIEMBRO"} ·{" "}
                {new Intl.DateTimeFormat("es-MX", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(m.created_at))}
              </span>
              {m.message}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-ink-secondary">
          Sin mensajes. Al escribir aquí, el hilo aparece en el detalle del
          reintegro del miembro (y recibe una notificación).
        </p>
      )}
      {error && (
        <span className="text-sm font-semibold text-error-text">{error}</span>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!message.trim()) return;
          setBusy(true);
          setError(null);
          const result = await sendReimbursementMessage(
            reimbursementId,
            message,
          );
          setBusy(false);
          if (!result.error) {
            setMessage("");
            router.refresh();
          } else setError(result.error);
        }}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Escribe al miembro sobre esta solicitud…"
          className="min-w-0 flex-1 rounded-[12px] border-[1.5px] border-border-input p-3 text-sm text-ink-body outline-none focus:border-teal"
        />
        <button
          type="submit"
          disabled={busy || !message.trim()}
          className="grid h-11 flex-none place-items-center rounded-full bg-teal px-5 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-50"
        >
          {busy ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </section>
  );
}
