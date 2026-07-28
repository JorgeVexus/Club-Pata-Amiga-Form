"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolvePet } from "@/app/admin/actions";

export function PetReviewRow({
  pet,
  detailSlot,
}: {
  detailSlot?: React.ReactNode;
  pet: {
    id: string;
    name: string;
    species: "dog" | "cat";
    breed: string | null;
    ageLabel: string;
    isSenior: boolean;
    hasCertificate: boolean;
    photoUrl: string | null;
    owner: string;
    registered: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");

  function run(decision: Parameters<typeof resolvePet>[1]) {
    startTransition(async () => {
      await resolvePet(pet.id, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_10px_rgba(30,83,80,.05)] sm:flex-row sm:items-center">
      <div className="grid size-14 flex-none place-items-center overflow-hidden rounded-[14px] bg-info-bg text-xl">
        {pet.photoUrl ? (
          <img src={pet.photoUrl} alt={pet.name} className="size-full object-cover" />
        ) : pet.species === "dog" ? (
          "🐕"
        ) : (
          "🐈"
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-sm font-bold text-ink-title">
          {pet.name}
          {pet.breed ? ` · ${pet.breed}` : ""} · {pet.ageLabel}
        </span>
        <span className="text-xs text-ink-tertiary">
          {pet.owner} · registrada el {pet.registered}
        </span>
        {pet.isSenior && (
          <span
            className={`text-xs font-semibold ${pet.hasCertificate ? "text-success-text" : "text-warning-text"}`}
          >
            Senior (10+):{" "}
            {pet.hasCertificate
              ? "certificado veterinario recibido ✓"
              : "falta certificado veterinario"}
          </span>
        )}
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
            Denegar…
          </button>
        </div>
      ) : (
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            autoFocus
            placeholder="Observaciones para el miembro"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-full border-[1.5px] border-border-input px-4 text-[13px] text-ink-title outline-none focus:border-teal sm:w-64"
          />
          <button
            type="button"
            disabled={pending || notes.trim().length === 0}
            onClick={() => run({ approve: false, notes: notes.trim() })}
            className="grid h-10 flex-none place-items-center rounded-full bg-error-text px-4 text-[13px] font-bold text-white disabled:opacity-50"
          >
            Denegar
          </button>
        </div>
      )}
    </div>
  );
}
