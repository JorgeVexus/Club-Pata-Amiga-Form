"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resendGiftEmail } from "@/app/admin/actions";

export function ResendGiftButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("Reenviar 🎁");

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await resendGiftEmail(leadId);
          setLabel(result.ok ? "Enviado ✓" : "Falló ✗");
          setTimeout(() => setLabel("Reenviar 🎁"), 3000);
          router.refresh();
        })
      }
      className="rounded-full border-[1.5px] border-teal px-3 py-1 text-[11px] font-bold text-teal-deep transition-colors hover:bg-teal hover:text-white disabled:opacity-60"
    >
      {pending ? "Enviando…" : label}
    </button>
  );
}
