/**
 * Trae los planConnections reales de cada miembro desde la Admin API de
 * Memberstack (fuente de verdad de facturacion en el sistema viejo) y
 * llena `subscriptions` en produccion. Sin esto, `sub` en
 * src/app/app/layout.tsx sale null para todos los miembros migrados y
 * pierden el boton de emergencia, el estado "Activa" del dashboard, etc.
 *
 * Uso: MEMBERSTACK_ADMIN_SECRET_KEY=sk_... npx tsx scripts/cutover-backfill-subscriptions.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const MS_KEY = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;
const APPLY = process.argv.includes("--apply");

async function fetchAllMembers() {
  let all = [];
  let after = null;
  let page = 0;
  do {
    let url = `https://admin.memberstack.com/members?limit=100`;
    if (after) url += `&after=${after}`;
    const res = await fetch(url, { headers: { "X-API-KEY": MS_KEY } });
    if (!res.ok) throw new Error(`Memberstack ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const members = data.data || [];
    all = all.concat(members);
    page++;
    after = data.hasNextPage ? data.endCursor : null;
    console.log(`pagina ${page}: ${members.length} (total ${all.length})`);
  } while (after && page < 10);
  return all;
}

const { data: profiles } = await supabase
  .from("profiles")
  .select("id, email, memberstack_id, membership_status")
  .not("memberstack_id", "is", null);
console.log(`Profiles con memberstack_id: ${profiles.length}`);

const members = await fetchAllMembers();
console.log(`Miembros en Memberstack: ${members.length}`);
const byId = new Map(members.map((m) => [m.id, m]));

let created = 0, skippedNoActive = 0, skippedNoMember = 0, err = 0;
for (const p of profiles) {
  const m = byId.get(p.memberstack_id);
  if (!m) { skippedNoMember++; continue; }
  const active = (m.planConnections ?? []).find(
    (c) => c.status?.toLowerCase() === "active" || c.status?.toLowerCase() === "trialing",
  );
  if (!active) { skippedNoActive++; continue; }

  const priceId = active.payment?.priceId ?? active.priceId ?? "";
  const plan = /anual|annual|year/i.test(priceId) ? "annual" : "monthly";
  const planName = plan === "annual" ? "Plan Anual" : "Plan Mensual";
  const amount = active.payment?.amount ?? (plan === "annual" ? 1699 : 159);

  if (!APPLY) { console.log(`[preview] ${p.email}: plan=${plan} amount=${amount} customer=${m.stripeCustomerId}`); continue; }

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: p.id,
    stripe_customer_id: m.stripeCustomerId ?? null,
    stripe_subscription_id: active.payment?.stripeSubscriptionId ?? null,
    plan,
    plan_name: planName,
    amount,
    currency: (active.payment?.currency ?? "mxn").toUpperCase(),
    status: "active",
    cancel_at_period_end: false,
    current_period_end: active.payment?.nextBillingDate
      ? new Date(active.payment.nextBillingDate * 1000).toISOString()
      : null,
  });
  if (error) { console.error(`error ${p.email}:`, error.message); err++; } else created++;
}
console.log({ created, skippedNoActive, skippedNoMember, err, applied: APPLY });
