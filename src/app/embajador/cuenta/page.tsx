import { ChangePasswordCard } from "@/components/app/ChangePasswordCard";
import { LogoutButton } from "@/components/app/LogoutButton";
import { PaymentDataCard } from "../PaymentDataCard";
import { getAmbassadorContext } from "../shared";

export const metadata = { title: "Mi cuenta de embajador · Club Pata Amiga" };

/** Ajustes del embajador: datos de pago (con titular) y contraseña. */
export default async function EmbajadorCuentaPage() {
  const { ambassador } = await getAmbassadorContext();

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4 px-5 py-5 sm:px-8">
      <h1 className="font-display text-[24px] text-ink-title">Mi cuenta</h1>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PaymentDataCard
          initialBank={ambassador.bank_name}
          initialClabe={ambassador.clabe}
          initialHolder={ambassador.bank_holder}
        />
        <ChangePasswordCard />
      </div>
      <div className="flex justify-start">
        <LogoutButton variant="button" />
      </div>
    </div>
  );
}
