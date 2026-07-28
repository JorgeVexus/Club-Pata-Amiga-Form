"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

import { validateCurp } from "@/lib/curp";

type Initial = {
  first_name?: string | null;
  last_name?: string | null;
  mother_last_name?: string | null;
  phone?: string | null;
  curp?: string | null;
  postal_code?: string | null;
  state?: string | null;
  city?: string | null;
  colony?: string | null;
  street?: string | null;
  number_ext?: string | null;
  number_int?: string | null;
};

function joinName(i: Initial) {
  return [i.first_name, i.last_name, i.mother_last_name]
    .filter(Boolean)
    .join(" ");
}

/** MX convention: the last two tokens are apellidos, the rest is nombre(s). */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1)
    return { first_name: full.trim() || null, last_name: null, mother_last_name: null };
  if (parts.length === 2)
    return { first_name: parts[0], last_name: parts[1], mother_last_name: null };
  return {
    first_name: parts.slice(0, -2).join(" "),
    last_name: parts[parts.length - 2],
    mother_last_name: parts[parts.length - 1],
  };
}

function IneUpload({
  side,
  label,
  fileName,
  onUploaded,
  userId,
}: {
  side: "ine_front" | "ine_back";
  label: string;
  fileName: string | null;
  onUploaded: (name: string) => void;
  userId: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const uploaded = Boolean(fileName);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(false);
    const supabase = createClient();
    const path = `${userId}/${side}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("ine-documents")
      .upload(path, file);
    if (upErr) {
      setError(true);
      setBusy(false);
      return;
    }
    await supabase.from("documents").insert({
      user_id: userId,
      document_type: side,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    });
    onUploaded(file.name);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={
        uploaded
          ? "flex flex-col items-center gap-1 rounded-[14px] border-[1.5px] border-[#D4EDD4] bg-[#F4FAF4] p-[18px]"
          : "flex flex-col items-center gap-1 rounded-[14px] border-2 border-dashed border-[#C9E9E4] bg-[#F2FAF9] p-[18px] transition-colors hover:border-teal"
      }
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFile}
      />
      <span className="text-xl" aria-hidden>
        {uploaded ? "✅" : "🪪"}
      </span>
      <span
        className={`text-[13px] font-semibold ${uploaded ? "text-success-text" : "text-teal-deep"}`}
      >
        {label}
      </span>
      <span className="max-w-full truncate text-[11px] text-ink-tertiary">
        {busy ? "Subiendo…" : error ? "Error, intenta de nuevo" : (fileName ?? "Subir foto")}
      </span>
    </button>
  );
}

export function ProfileForm({
  userId,
  initial,
  ineFront,
  ineBack,
}: {
  userId: string;
  initial: Initial;
  ineFront: string | null;
  ineBack: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(joinName(initial));
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [curp, setCurp] = useState(initial.curp ?? "");
  const [cp, setCp] = useState(initial.postal_code ?? "");
  const [stateMx, setStateMx] = useState(initial.state ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [colony, setColony] = useState(initial.colony ?? "");
  const [colonies, setColonies] = useState<string[]>(
    initial.colony ? [initial.colony] : [],
  );
  const [street, setStreet] = useState(initial.street ?? "");
  const [numExt, setNumExt] = useState(initial.number_ext ?? "");
  const [numInt, setNumInt] = useState(initial.number_int ?? "");
  const [frontFile, setFrontFile] = useState(ineFront);
  const [backFile, setBackFile] = useState(ineBack);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const curpValid = validateCurp(curp).isValid;

  // Sepomex lookup when a full CP is typed
  useEffect(() => {
    if (!/^\d{5}$/.test(cp)) return;
    let cancelled = false;
    fetch(`/api/sepomex?cp=${cp}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.found) return;
        setStateMx(data.state);
        setCity(data.city);
        setColonies(data.colonies);
        if (!data.colonies.includes(colony)) setColony(data.colonies[0] ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cp]);

  const completion =
    20 * Number(fullName.trim().length > 0) +
    20 * Number(curpValid) +
    20 * Number(cp.length === 5 && colony && street) +
    20 * Number(Boolean(frontFile)) +
    20 * Number(Boolean(backFile));

  async function save(finalize: boolean) {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        ...splitName(fullName),
        phone: phone || null,
        curp: curp ? curp.toUpperCase() : null,
        postal_code: cp || null,
        state: stateMx || null,
        city: city || null,
        colony: colony || null,
        street: street || null,
        number_ext: numExt || null,
        number_int: numInt || null,
        street_address:
          [street, numExt && `#${numExt}`, numInt && `Int. ${numInt}`]
            .filter(Boolean)
            .join(" ") || null,
        profile_completed: completion === 100,
      })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      setMessage("No pudimos guardar. Intenta de nuevo.");
      return;
    }
    if (finalize && completion === 100) {
      router.push("/app");
    } else if (finalize) {
      setMessage(
        "Guardado. Aún faltan datos o documentos para completar el perfil.",
      );
    } else {
      router.push("/app");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] text-ink-title md:text-[34px]">
            Completa tu perfil
          </h1>
          <p className="mt-1.5 text-[14.5px] text-ink-secondary">
            Necesitamos estos datos para validar tu identidad y habilitar tus
            reintegros.
          </p>
        </div>
        <div className="grid size-16 flex-none place-items-center rounded-full bg-white shadow-[0_2px_10px_rgba(30,83,80,.08)]">
          <span className="font-display text-base text-teal-deep">
            {completion}%
          </span>
        </div>
      </div>

      {/* Form envolvente: Enter en cualquier campo = "Finalizar perfil" (paso siguiente) */}
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
      >
      <section className="flex flex-col gap-4 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
        <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
          TUS DATOS
        </span>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <TextField
            label="Nombre completo"
            placeholder="Nombre y apellidos"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <TextField
            label="Teléfono"
            type="tel"
            placeholder="+52 ··· ··· ····"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <TextField
          label="CURP"
          placeholder="18 caracteres"
          value={curp}
          maxLength={18}
          onChange={(e) => setCurp(e.target.value.toUpperCase())}
          style={{ letterSpacing: ".06em" }}
          rightSlot={
            curp.length > 0 ? (
              curpValid ? (
                <span className="text-sm text-success-text">✓</span>
              ) : (
                <span className="text-xs text-error-text">
                  {curp.length}/18
                </span>
              )
            ) : undefined
          }
          hint={
            curp.length > 0 && !curpValid
              ? "Revisa el formato de tu CURP."
              : undefined
          }
        />
      </section>

      <section className="flex flex-col gap-4 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
        <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
          TU DOMICILIO
        </span>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[180px_1fr]">
          <TextField
            label="Código postal"
            inputMode="numeric"
            maxLength={5}
            placeholder="76230"
            value={cp}
            onChange={(e) => setCp(e.target.value.replace(/\D/g, ""))}
            autoComplete="postal-code"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-title">
              Colonia{" "}
              <span className="font-medium text-ink-tertiary">
                (auto-completada)
              </span>
            </label>
            {colonies.length > 0 ? (
              <select
                className="h-12 w-full appearance-none rounded-[12px] border-[1.5px] border-border-input bg-white px-4 text-[15px] text-ink-title outline-none focus:border-2 focus:border-teal"
                value={colony}
                onChange={(e) => setColony(e.target.value)}
              >
                {colonies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="h-12 w-full rounded-[12px] border-[1.5px] border-border-input bg-white px-4 text-[15px] text-ink-title placeholder:text-ink-placeholder outline-none focus:border-2 focus:border-teal"
                placeholder="Escribe tu colonia"
                value={colony}
                onChange={(e) => setColony(e.target.value)}
              />
            )}
          </div>
        </div>
        {stateMx && (
          <span className="-mt-1 text-[12.5px] text-ink-tertiary">
            {city}, {stateMx}
          </span>
        )}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_120px_120px]">
          <TextField
            label="Calle"
            placeholder="Av. de la Luz"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
          <TextField
            label="No. ext."
            placeholder="128"
            value={numExt}
            onChange={(e) => setNumExt(e.target.value)}
          />
          <TextField
            label="No. int."
            placeholder="—"
            value={numInt}
            onChange={(e) => setNumInt(e.target.value)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[20px] bg-white p-5 shadow-[var(--shadow-card)] md:p-[26px]">
        <span className="text-[13px] font-extrabold tracking-[.06em] text-teal-deep">
          TU IDENTIFICACIÓN (INE)
        </span>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <IneUpload
            side="ine_front"
            label="INE — frente"
            fileName={frontFile}
            onUploaded={setFrontFile}
            userId={userId}
          />
          <IneUpload
            side="ine_back"
            label="INE — reverso"
            fileName={backFile}
            onUploaded={setBackFile}
            userId={userId}
          />
        </div>
      </section>

      {message && (
        <div className="rounded-[12px] bg-info-bg px-4 py-3 text-sm text-info-text">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <Button
          variant="outline"
          className="md:flex-1"
          disabled={saving}
          onClick={() => save(false)}
        >
          Guardar y continuar después
        </Button>
        <Button
          type="submit"
          className="md:flex-1"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Finalizar perfil"}
        </Button>
      </div>
      </form>
    </>
  );
}
