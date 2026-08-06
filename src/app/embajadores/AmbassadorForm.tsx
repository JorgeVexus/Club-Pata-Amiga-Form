"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { registerAmbassador } from "./actions";

export function AmbassadorForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [curp, setCurp] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  // Fecha de nacimiento y motivación (equipo, 5-ago)
  const [birthDate, setBirthDate] = useState("");
  const [motivation, setMotivation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await registerAmbassador({
        firstName,
        lastName,
        email,
        phone,
        curp,
        state,
        city,
        isAdult,
        birthDate,
        motivation,
      });
      if (result.error) setError(result.error);
      else setDone(true);
    } catch {
      setError("Algo salió mal. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[20px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(30,83,80,.06)]">
        <span className="text-[42px]" aria-hidden>
          🎉
        </span>
        <h2 className="font-display text-[24px] text-ink-title">
          ¡Solicitud recibida!
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">
          El comité revisará tu solicitud y te contactaremos por correo. Al ser
          aprobada, recibirás tu código único de embajador para empezar a
          compartir.
        </p>
        <Link href="/" className="font-semibold text-teal-deep hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-[20px] bg-white p-6 shadow-[0_2px_12px_rgba(30,83,80,.06)]"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nombre"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <TextField
          label="Apellidos"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Teléfono"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <TextField
        label="CURP"
        value={curp}
        onChange={(e) => setCurp(e.target.value.toUpperCase())}
        maxLength={18}
        placeholder="18 caracteres"
        hint="La usamos para validar que eres mayor de edad."
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Estado"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <TextField
          label="Ciudad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      <TextField
        label="Fecha de nacimiento"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
      />
      <TextField
        label="¿Por qué quieres ser embajador?"
        value={motivation}
        onChange={(e) => setMotivation(e.target.value)}
        placeholder="Cuéntanos tu motivación en una o dos líneas"
      />
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-secondary">
        <input
          type="checkbox"
          checked={isAdult}
          onChange={(e) => setIsAdult(e.target.checked)}
          className="mt-0.5 size-4 accent-[#1CBCAD]"
        />
        Confirmo que soy mayor de edad y acepto que el comité revise mi
        solicitud.
      </label>

      {error && (
        <div className="rounded-[12px] bg-error-bg px-4 py-3 text-sm font-semibold text-error-text">
          {error}
        </div>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Enviando…" : "Quiero ser embajador"}
      </Button>
    </form>
  );
}
