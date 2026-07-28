"use client";

import { useState } from "react";
import { AMBASSADOR_CODE_PREFIX } from "@/lib/constants";
import { customizeCode } from "./actions";

/** Tarjeta teal oscuro del código de embajador (screen 6a). */
export function CodeCard({
  code,
  canCustomize,
}: {
  code: string;
  canCustomize: boolean;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [editing, setEditing] = useState(false);
  const [suffix, setSuffix] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const copy = async (text: string, what: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const shareLink = () => {
    const url = `${window.location.origin}/registro?codigo=${encodeURIComponent(code)}`;
    if (navigator.share) {
      navigator
        .share({
          title: "Club Pata Amiga",
          text: `Únete a la manada con mi código ${code} 🐾`,
          url,
        })
        .catch(() => {});
    } else {
      copy(url, "link");
    }
  };

  const submitCustomize = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await customizeCode(suffix);
      if (result.error) setError(result.error);
      else setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-[20px] bg-teal-dark p-6">
      <div className="blob absolute -bottom-[70px] -right-[60px] size-[220px] bg-white/[.08]" />
      <span className="relative text-[11px] font-extrabold tracking-[.08em] text-lime">
        TU CÓDIGO DE EMBAJADOR
      </span>
      <div className="relative flex flex-wrap items-center gap-3">
        <span className="font-display text-[26px] tracking-[.04em] text-white sm:text-[34px]">
          {code}
        </span>
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="rounded-full bg-white/15 px-3.5 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-white/25"
        >
          {copied === "code" ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      <span className="relative text-[12.5px] text-white/75">
        Compártelo en tus redes — cada suscripción con tu código te genera
        comisión.
      </span>

      {editing ? (
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white/80">
              {AMBASSADOR_CODE_PREFIX}
            </span>
            <input
              value={suffix}
              onChange={(e) =>
                setSuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              maxLength={15}
              placeholder="TUNOMBRE"
              className="h-10 w-40 rounded-[10px] border-[1.5px] border-white/30 bg-white/10 px-3 text-sm font-bold tracking-wide text-white outline-none placeholder:text-white/40 focus:border-lime"
            />
            <button
              type="button"
              onClick={submitCustomize}
              disabled={busy || suffix.length < 3}
              className="grid h-10 place-items-center rounded-full bg-lime px-4 text-xs font-extrabold text-teal-dark disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-semibold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
          </div>
          <span className="text-[11.5px] text-white/60">
            Solo se puede personalizar una vez — elígelo bien. 😉
          </span>
          {error && (
            <span className="text-[12px] font-semibold text-[#FFB3C4]">
              {error}
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shareLink}
            className="grid h-10 place-items-center rounded-full bg-lime px-[18px] text-xs font-extrabold text-teal-dark transition-opacity hover:opacity-90"
          >
            {copied === "link" ? "¡Link copiado!" : "Compartir link"}
          </button>
          {canCustomize && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="grid h-10 place-items-center rounded-full border-[1.5px] border-white/35 px-[18px] text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              Personalizar código
            </button>
          )}
        </div>
      )}
    </div>
  );
}
