"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchPlan, cancelMembership, reactivateMembership } from "./actions";
import { PLANS } from "@/lib/constants";
import { formatMxn } from "@/lib/format";

const CANCEL_REASONS = [
  "Es muy costoso para mí",
  "No lo he usado",
  "Mi peludo falleció",
  "Encontré otra opción",
  "Otro motivo",
];

export function MembershipManager({
  plan,
  cancelAtPeriodEnd,
  renewsLabel,
}: {
  plan: "monthly" | "annual";
  cancelAtPeriodEnd: boolean;
  renewsLabel: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const other = plan === "monthly" ? "annual" : "monthly";
  const otherInfo = PLANS[other];
  const currentInfo = PLANS[plan];

  function run(action: () => Promise<unknown>, successMessage: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(successMessage);
        setConfirmSwitch(false);
        setCancelOpen(false);
        router.refresh();
      } catch {
        setError("No pudimos completar el cambio. Intenta de nuevo.");
      }
    });
  }

  return (
    <>
      {/* Current plan */}
      <section className="relative flex flex-col gap-2 overflow-hidden rounded-[20px] bg-teal p-5 md:p-[26px]">
        <div className="blob absolute -bottom-[60px] -right-10 size-[170px] bg-white/[.14]" />
        <span className="relative text-[11px] font-bold tracking-[.06em] text-white/85">
          MEMBRESÍA {cancelAtPeriodEnd ? "· CANCELACIÓN PROGRAMADA" : "ACTIVA"}
        </span>
        <span className="relative font-display text-[26px] text-white">
          Plan {currentInfo.name} · {formatMxn(currentInfo.amountMxn)} MXN/
          {plan === "annual" ? "año" : "mes"}
        </span>
        {renewsLabel && (
          <span className="relative text-[12.5px] text-white/85">
            {cancelAtPeriodEnd
              ? `Tu protección termina el ${renewsLabel}`
              : `Renueva el ${renewsLabel}`}
          </span>
        )}
      </section>

      {message && (
        <div className="rounded-[12px] bg-success-bg px-4 py-3 text-sm font-semibold text-success-text">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-[12px] bg-error-bg px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      )}

      {cancelAtPeriodEnd ? (
        /* Pending cancellation → offer reactivation */
        <section className="flex flex-col items-start gap-3 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
          <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
            ¿CAMBIASTE DE OPINIÓN?
          </span>
          <p className="text-sm leading-normal text-ink-body">
            Tu membresía sigue activa hasta {renewsLabel ?? "el fin de tu período"};
            después ya no se renovará. Puedes reactivarla y todo sigue igual.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(reactivateMembership, "¡Bienvenido de vuelta! Tu membresía se renovará con normalidad.")
            }
            className="grid h-11 place-items-center rounded-full bg-teal px-6 text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
          >
            {pending ? "Un momento…" : "Reactivar mi membresía"}
          </button>
        </section>
      ) : (
        <>
          {/* Plan switch */}
          <section className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
            <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
              CAMBIAR DE PLAN
            </span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-sm font-bold text-ink-title">
                  Plan {otherInfo.name}
                  {other === "annual" && (
                    <span className="rounded-full bg-pink px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-[.06em] text-white">
                      AHORRA 10%
                    </span>
                  )}
                </span>
                <span className="text-[12.5px] text-ink-tertiary">
                  {formatMxn(otherInfo.amountMxn)} MXN/
                  {other === "annual" ? "año" : "mes"}
                </span>
              </div>
              {!confirmSwitch && (
                <button
                  type="button"
                  onClick={() => setConfirmSwitch(true)}
                  className="grid h-11 flex-none place-items-center rounded-full border-2 border-teal px-5 text-[13px] font-bold text-teal-deep transition-colors hover:bg-teal hover:text-white"
                >
                  Cambiar a {otherInfo.name}
                </button>
              )}
            </div>
            {confirmSwitch && (
              <div className="flex flex-col gap-3 rounded-[14px] bg-cream p-4">
                <p className="text-[13px] leading-normal text-ink-body">
                  {other === "annual"
                    ? "El cambio aplica hoy: se abona lo que ya pagaste de tu mes en curso y se cobra la diferencia del plan Anual en tu tarjeta."
                    : `El cambio aplica hoy sin reembolso: tu período Anual ya pagado sigue vigente${renewsLabel ? ` hasta el ${renewsLabel}` : ""} y a partir de entonces se cobra ${formatMxn(PLANS.monthly.amountMxn)} MXN al mes.`}
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => switchPlan(other),
                        `¡Listo! Ahora tienes el plan ${otherInfo.name}.`,
                      )
                    }
                    className="grid h-11 flex-1 place-items-center rounded-full bg-teal text-[13px] font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
                  >
                    {pending ? "Cambiando…" : `Confirmar cambio a ${otherInfo.name}`}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmSwitch(false)}
                    className="grid h-11 place-items-center rounded-full border-[1.5px] border-border-input px-5 text-[13px] font-semibold text-ink-secondary"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Cancellation */}
          <section className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
            <span className="text-[13px] font-extrabold tracking-[.06em] text-ink-tertiary">
              CANCELAR MEMBRESÍA
            </span>
            {!cancelOpen ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] leading-normal text-ink-secondary">
                  Tu protección seguiría activa hasta el fin de tu período pagado
                  y tus datos se conservan por si quieres volver.
                </p>
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="grid h-10 flex-none place-items-center rounded-full border-[1.5px] border-border-input px-5 text-[13px] font-semibold text-ink-secondary transition-colors hover:border-error-text hover:text-error-text"
                >
                  Cancelar…
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-ink-title">
                  ¿Por qué te vas? Nos ayuda a mejorar.
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CANCEL_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        reason === r
                          ? "border-teal bg-info-bg text-teal-deep"
                          : "border-border-input text-ink-secondary hover:border-teal"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="¿Algo más que quieras contarnos? (opcional)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  className="rounded-[12px] border-[1.5px] border-border-input p-3 text-sm text-ink-title placeholder:text-ink-placeholder outline-none focus:border-teal"
                />
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={pending || !reason}
                    onClick={() =>
                      run(
                        () => cancelMembership(reason, comments.trim()),
                        "Tu cancelación quedó programada. Tu manada sigue protegida hasta el fin del período.",
                      )
                    }
                    className="grid h-11 place-items-center rounded-full bg-error-text px-5 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {pending ? "Cancelando…" : "Confirmar cancelación"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setCancelOpen(false)}
                    className="grid h-11 place-items-center rounded-full border-[1.5px] border-border-input px-5 text-[13px] font-semibold text-ink-secondary"
                  >
                    Conservar mi membresía
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
