import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { aplicarEventoResend } from "@/lib/newsletter/envio";

/**
 * Webhook de Resend: entregado, abierto, rebotado, queja.
 *
 * CONECTAR: en el panel de Resend se da de alta esta URL
 * (https://<dominio>/api/webhooks/resend) y la palabra secreta que devuelve
 * va a `RESEND_WEBHOOK_SECRET`. Sin esa variable el endpoint acepta todo y lo
 * dice en el log — el mismo criterio que el webhook de Meta, para poder
 * trabajar en local sin túnel.
 *
 * Resend firma con Svix: la firma es un HMAC-SHA256 sobre
 * "<id>.<timestamp>.<cuerpo>" con la llave en base64 después del prefijo
 * "whsec_".
 */

function firmaValida(
  crudo: string,
  headers: Headers,
  secreto: string,
): boolean {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const firmas = headers.get("svix-signature");
  if (!id || !ts || !firmas) return false;

  // Ventana de 5 minutos: una firma vieja reenviada no vale.
  const edad = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(edad) || edad > 300) return false;

  const llave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", llave)
    .update(`${id}.${ts}.${crudo}`)
    .digest("base64");

  // El encabezado puede traer varias firmas separadas por espacio ("v1,xxx").
  for (const parte of firmas.split(" ")) {
    const valor = parte.split(",")[1];
    if (!valor) continue;
    const a = Buffer.from(valor);
    const b = Buffer.from(esperada);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export async function POST(request: Request) {
  const crudo = await request.text();
  const secreto = process.env.RESEND_WEBHOOK_SECRET;

  if (secreto) {
    if (!firmaValida(crudo, request.headers, secreto))
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  } else {
    console.warn(
      "[resend] RESEND_WEBHOOK_SECRET sin configurar: se acepta el evento sin verificar la firma",
    );
  }

  let evento: { type: string; data: { email_id?: string; bounce?: { type?: string } } };
  try {
    evento = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "Cuerpo ilegible" }, { status: 400 });
  }

  const admin = createAdminClient();
  const res = await aplicarEventoResend(admin, evento);

  // Siempre 200: un webhook que responde error hace que Resend reintente en
  // bucle un evento que no es nuestro (por ejemplo, un correo transaccional).
  return NextResponse.json({ ok: true, ...res });
}
