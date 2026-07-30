import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { crmEventoDeUsuario } from "@/lib/crm/sync";
import { versionVigente } from "@/lib/plans/versiones";

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { plan, ambassadorCode } = await request.json();
  if (!PRICE_BY_PLAN[plan] && plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  // La versión publicada manda sobre la variable de entorno. Si todavía no hay
  // versión con precio en Stripe (o falla la consulta), se usa el precio de
  // siempre: el cobro nunca se queda sin funcionar por el motor de planes.
  const versionPublicada = await versionVigente(
    createAdminClient(),
    plan === "annual" ? "year" : "month",
  );
  const price = versionPublicada?.stripe_price_id ?? PRICE_BY_PLAN[plan];
  if (!price) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  // Guard against double-subscribing (e.g. re-visiting /registro/plan after paying)
  const guard = createAdminClient();
  const { data: existingSub } = await guard
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (existingSub) {
    return NextResponse.json(
      { error: "Ya tienes una membresía activa. Cambia de plan desde Mi cuenta." },
      { status: 409 },
    );
  }

  // Ambassador code is optional; only forward it if it is real and approved
  let validCode: string | undefined;
  if (ambassadorCode) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("ambassadors")
      .select("id")
      .eq("referral_code", ambassadorCode)
      .eq("status", "approved")
      .maybeSingle();
    if (data) validCode = ambassadorCode;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: user.email,
    // Campo "código de promoción" en el checkout — aquí viven los cupones
    // de las landings (se crean manualmente en Stripe → Promotion codes)
    allow_promotion_codes: true,
    success_url: `${siteUrl}/registro/bienvenida?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/registro/plan`,
    metadata: {
      user_id: user.id,
      plan,
      // Viaja la versión para que el webhook NUNCA tenga que adivinar de qué
      // versión fue este pago al tomar la foto de beneficios.
      ...(versionPublicada ? { plan_version_id: versionPublicada.id } : {}),
      ...(validCode ? { ambassador_code: validCode } : {}),
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
        ...(versionPublicada ? { plan_version_id: versionPublicada.id } : {}),
      },
    },
  });

  // CRM: llegó al checkout. La tarjeta entra a "Registro iniciado" y, si en 24 h
  // no hay pago, la tarea diaria la pasa a "Carrito abandonado" — el embudo que
  // hoy tiene 228 tarjetas en LynSales y nadie puede trabajar porque no se sabe
  // en qué paso se cayó cada persona.
  await crmEventoDeUsuario(guard, {
    userId: user.id,
    kind: "checkout_abierto",
    summary: `Abrió el checkout del plan ${plan}`,
    stageKey: "registro_iniciado",
    interval: plan === "annual" ? "year" : "month",
    payload: { sessionId: session.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
