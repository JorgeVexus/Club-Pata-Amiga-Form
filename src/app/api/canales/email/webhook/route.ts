import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/alerts";
import {
  guardarCorreoEntrante,
  parsearReferencias,
  type CorreoEntrante,
} from "@/lib/channels/email";

/**
 * Entrada de correo a la bandeja.
 *
 * CONECTAR: el buzón de dominio del cliente (subdominio por decidir, p. ej.
 * hola@pataamiga.mx) apunta aquí su webhook de correo entrante. Se acepta la
 * forma de Resend y una forma genérica, porque el proveedor lo elige el cliente
 * y no queremos que esa decisión obligue a reescribir el enganche de hilos.
 *
 * Autenticación: `EMAIL_WEBHOOK_SECRET` en el encabezado
 * `x-webhook-secret` (o `?secret=`). Sin la variable configurada la ruta solo
 * acepta llamadas locales, para poder probar en desarrollo sin abrir un agujero.
 */

function autorizado(request: Request): boolean {
  const secreto = process.env.EMAIL_WEBHOOK_SECRET;
  const url = new URL(request.url);
  if (secreto) {
    return (
      request.headers.get("x-webhook-secret") === secreto ||
      url.searchParams.get("secret") === secreto
    );
  }
  // Sin secreto configurado: solo desarrollo local.
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

/** Normaliza las formas que mandan los distintos proveedores. */
function leerCarga(cuerpo: Record<string, unknown>): CorreoEntrante | null {
  // Resend envuelve el correo en { type, data: {...} }
  const datos = (
    typeof cuerpo.data === "object" && cuerpo.data !== null ? cuerpo.data : cuerpo
  ) as Record<string, unknown>;

  const texto = (datos.text ??
    datos.plain ??
    datos.body ??
    datos.html ??
    "") as string;

  const from = (datos.from ?? datos.sender ?? "") as string;
  if (!from) return null;

  const to = Array.isArray(datos.to)
    ? (datos.to as string[])
    : typeof datos.to === "string"
      ? [datos.to]
      : [];

  // Los encabezados pueden venir sueltos o dentro de `headers`
  const headers = (
    typeof datos.headers === "object" && datos.headers !== null
      ? datos.headers
      : {}
  ) as Record<string, string | string[]>;
  const enc = (nombre: string) =>
    (datos[nombre.toLowerCase().replace(/-/g, "_")] as string | undefined) ??
    headers[nombre] ??
    headers[nombre.toLowerCase()] ??
    null;

  const messageId = (enc("Message-ID") ?? enc("Message-Id") ?? null) as string | null;

  return {
    messageId: messageId ? String(messageId).trim() : null,
    inReplyTo: (enc("In-Reply-To") as string | null)?.trim() ?? null,
    references: parsearReferencias(enc("References")),
    from,
    to,
    subject: (datos.subject as string | undefined) ?? null,
    // Si solo vino HTML, se guarda una versión legible: la bandeja muestra texto.
    texto: String(texto)
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim(),
  };
}

export async function POST(request: Request) {
  if (!autorizado(request))
    return NextResponse.json({ error: "Sin permisos" }, { status: 401 });

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Carga inválida" }, { status: 400 });
  }

  const correo = leerCarga(cuerpo);
  if (!correo)
    return NextResponse.json(
      { error: "La carga no trae remitente" },
      { status: 400 },
    );

  try {
    const admin = createAdminClient();
    const res = await guardarCorreoEntrante(admin, correo);
    if (!res.ok)
      // Duplicado: el proveedor reintentó. Se responde 200 para que deje de
      // reintentar.
      return NextResponse.json({ received: true, omitido: res.motivo });

    return NextResponse.json({
      received: true,
      conversationId: res.hilo.conversationId,
      via: res.hilo.via,
      nuevo: res.hilo.nuevo,
    });
  } catch (err) {
    await reportError("email-webhook", err, { from: correo.from });
    return NextResponse.json({ error: "No se pudo procesar" }, { status: 500 });
  }
}

/** Algunos proveedores verifican el endpoint con un GET. */
export async function GET() {
  return NextResponse.json({ ok: true, canal: "email" });
}
