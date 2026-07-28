"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { payAmbassadorCut } from "@/app/admin/actions";

export function PayCutButton({ ambassadorId }: { ambassadorId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await payAmbassadorCut(ambassadorId);
          router.refresh();
        })
      }
      className="grid h-9 place-items-center rounded-full bg-teal px-4 text-xs font-bold text-white transition-colors hover:bg-teal-deep disabled:opacity-60"
    >
      {pending ? "Registrando…" : "Marcar pagado"}
    </button>
  );
}
