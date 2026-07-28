import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegistroHeader } from "@/components/registro/Header";
import { BenefitsMarquee } from "@/components/landing/BenefitsMarquee";
import { PlanSelector } from "./PlanSelector";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/registro");

  // Already a paying member? Plan changes live in Mi cuenta.
  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_status")
    .eq("id", user.id)
    .single();
  if (profile?.membership_status === "active") redirect("/app/cuenta");

  const { data: pets } = await supabase
    .from("pets")
    .select("name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const petName = pets?.[0]?.name ?? "tu peludo";

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <RegistroHeader step={3} />
      {/* Banda de beneficios — refuerzo en móvil como en la app anterior */}
      <div className="sm:hidden">
        <BenefitsMarquee variant="light" />
      </div>
      <div className="flex-1 pb-14 pt-4 sm:pt-11">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-5 sm:gap-7 sm:px-0">
          <PlanSelector petName={petName} initialCode={codigo} />
        </div>
      </div>
    </div>
  );
}
