"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createPromotion, deletePromotion, togglePromotion } from "./actions";

export type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  valid_until: string | null;
  is_active: boolean;
};

/**
 * Promociones del centro: lista con pausar/reactivar/borrar + alta de nuevas.
 * Las activas (y vigentes) salen en el directorio de centros al instante.
 */
export function PromotionsCard({ promotions }: { promotions: PromotionRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(promotions.length === 0);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expired = (p: PromotionRow) =>
    !!p.valid_until && new Date(`${p.valid_until}T23:59:59`) < new Date();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setError(null);
    const result = await createPromotion({
      title,
      description,
      discountLabel: discount,
      validUntil: validUntil || undefined,
    });
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTitle("");
    setDiscount("");
    setDescription("");
    setValidUntil("");
    setShowForm(false);
    router.refresh();
  }

  async function run(id: string, fn: () => Promise<{ error?: string }>) {
    setBusy(id);
    setError(null);
    const result = await fn();
    setBusy(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
          TUS PROMOCIONES
        </span>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full border-[1.5px] border-teal px-3.5 py-1.5 text-[12px] font-bold text-teal-deep transition-colors hover:bg-info-bg"
        >
          {showForm ? "Cerrar" : "+ Nueva promoción"}
        </button>
      </div>

      {promotions.length === 0 && !showForm && (
        <p className="text-[13px] text-ink-secondary">
          Aún no tienes promociones. Publica descuentos o beneficios y los
          miembros los verán en el directorio. 🐾
        </p>
      )}

      {promotions.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center gap-2.5 rounded-[14px] border-[1.5px] border-border-input px-3.5 py-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-ink-title">
              {p.title}
              {p.discount_label && (
                <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10.5px] font-extrabold text-warning-text">
                  🏷️ {p.discount_label}
                </span>
              )}
              {!p.is_active && (
                <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-extrabold text-ink-tertiary">
                  PAUSADA
                </span>
              )}
              {p.is_active && expired(p) && (
                <span className="rounded-full bg-error-bg px-2 py-0.5 text-[10px] font-extrabold text-error-text">
                  VENCIDA
                </span>
              )}
            </span>
            {p.description && (
              <span className="text-[12.5px] text-ink-secondary">
                {p.description}
              </span>
            )}
            {p.valid_until && (
              <span className="text-[11.5px] text-ink-tertiary">
                Vigente hasta{" "}
                {new Intl.DateTimeFormat("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(`${p.valid_until}T12:00:00`))}
              </span>
            )}
          </div>
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              disabled={busy === p.id}
              onClick={() => run(p.id, () => togglePromotion(p.id, !p.is_active))}
              className="rounded-full border-[1.5px] border-border-input px-3 py-1.5 text-[11.5px] font-bold text-ink-secondary transition-colors hover:border-teal hover:text-teal-deep"
            >
              {p.is_active ? "Pausar" : "Reactivar"}
            </button>
            <button
              type="button"
              aria-label="Borrar promoción"
              disabled={busy === p.id}
              onClick={() => run(p.id, () => deletePromotion(p.id))}
              className="grid size-8 place-items-center rounded-full text-sm font-bold text-error-text transition-colors hover:bg-error-bg"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3.5 rounded-[14px] bg-cream p-4"
        >
          <TextField
            label="Título"
            required
            placeholder="Ej. Descuento en baño y corte"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <TextField
              label="Descuento o beneficio"
              placeholder="Ej. 15% de descuento"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            <TextField
              label="Vigente hasta (opcional)"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <TextField
            label="Detalles (opcional)"
            placeholder="Ej. Presentando su membresía digital, de lunes a viernes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit" disabled={busy === "create"}>
            {busy === "create" ? "Publicando…" : "Publicar promoción"}
          </Button>
        </form>
      )}

      {error && (
        <div className="rounded-[12px] bg-error-bg px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      )}
    </div>
  );
}
