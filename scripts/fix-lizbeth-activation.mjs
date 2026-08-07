/**
 * Reconciliación puntual: el checkout de Lizbeth (2026-08-04) se pagó en Stripe
 * pero el webhook nunca corrió (checkout.session.completed no estaba suscrito
 * en el endpoint de Stripe). Este script replica exactamente lo que
 * handleCheckoutCompleted (src/app/api/stripe/webhook/route.ts) habría hecho,
 * usando los datos reales de la sesión de Stripe ya pagada.
 *
 * Uso: npx tsx scripts/fix-lizbeth-activation.mjs
 */
import { createAdminClient } from "../src/lib/supabase/admin.ts";
import { petWaitingPeriodDays } from "../src/lib/waiting-period.ts";
import { crmEventoDeUsuario, marcarComoMiembro } from "../src/lib/crm/sync.ts";
import { beneficiosDeVersion, esperasDe, tomarSnapshot } from "../src/lib/plans/resolve.ts";
import { diaEnMexicoMasDias } from "../src/lib/zona-horaria.ts";

// Datos reales tomados de la sesión de checkout ya pagada en Stripe
// (cs_live_b1mIwgiCepwPKEc9mYd2Lp9ZeKHbKloxlRBgTR9F29xoIGcZtf5gkZzZZY).
const session = {
  id: "cs_live_b1mIwgiCepwPKEc9mYd2Lp9ZeKHbKloxlRBgTR9F29xoIGcZtf5gkZzZZY",
  customer: "cus_V0b3PMH31rFffu",
  subscription: "sub_1U0ZrSRo5UnjPDWxh1ButEWl",
  amount_total: 15900,
  currency: "mxn",
  metadata: {
    user_id: "c31df090-7c86-41e5-a02e-f7e2c14b6bb8",
    plan: "monthly",
    plan_version_id: "fc9eef35-bb26-4a2e-8b57-a7c2367bca8b",
  },
};

const userId = session.metadata.user_id;
const supabase = createAdminClient();

const beneficios = await beneficiosDeVersion(supabase, session.metadata.plan_version_id);

const { data: profile } = await supabase
  .from("profiles")
  .select("email, first_name, waiting_period_end_date")
  .eq("id", userId)
  .single();

console.log("Perfil antes:", profile);

await supabase
  .from("profiles")
  .update({
    membership_status: "active",
    member_since: new Date().toISOString(),
    ...(profile?.waiting_period_end_date
      ? {}
      : { waiting_period_end_date: diaEnMexicoMasDias(180) }),
  })
  .eq("id", userId);

const { data: pets } = await supabase
  .from("pets")
  .select("id, species, name, breed, is_adopted")
  .eq("user_id", userId)
  .is("waiting_period_end_date", null);

const petDays = new Map();
for (const pet of pets ?? []) {
  const days = petWaitingPeriodDays(
    { isAdopted: pet.is_adopted, breed: pet.breed, hasReferralCode: false },
    esperasDe(beneficios),
  );
  petDays.set(pet.id, days);
  await supabase
    .from("pets")
    .update({ waiting_period_end_date: diaEnMexicoMasDias(days) })
    .eq("id", pet.id);
  console.log(`  ${pet.name}: ${days} días de espera`);
}

const { data: subRow } = await supabase
  .from("subscriptions")
  .upsert(
    {
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      plan: session.metadata.plan,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      status: "active",
    },
    { onConflict: "stripe_subscription_id" },
  )
  .select("id")
  .single();

console.log("Suscripción creada:", subRow);

if (subRow?.id)
  await tomarSnapshot(supabase, {
    subscriptionId: subRow.id,
    planVersionId: session.metadata.plan_version_id,
  });

await crmEventoDeUsuario(supabase, {
  userId,
  kind: "pago_confirmado",
  summary: `Pago confirmado — plan ${session.metadata.plan} (reconciliado a mano, webhook no llegó)`,
  stageKey: "pago_procesado",
  interval: session.metadata.plan === "annual" ? "year" : "month",
  payload: { sessionId: session.id, amount: session.amount_total },
});
await marcarComoMiembro(supabase, userId);

// Correo de bienvenida omitido a propósito (decisión explícita: avisarle
// directamente en vez del correo automático).
console.log("Correo de bienvenida NO enviado (omitido a propósito).");

const { data: after } = await supabase
  .from("profiles")
  .select("membership_status, member_since, waiting_period_end_date")
  .eq("id", userId)
  .single();
console.log("Perfil después:", after);
