import type { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { notifyTeam } from "@/lib/alerts";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * EL ENVÍO DEL BOLETÍN — sección 5, punto 5.
 *
 * Tres cosas sostienen esto:
 *
 *  1. `unique (edition_id, email)` en la base. Es la garantía de que un
 *     reintento no manda dos veces la misma edición a la misma persona — el
 *     error más visible que puede tener un boletín, y el que no se puede
 *     recoger.
 *  2. La lista se arma EXCLUYENDO bajas, rebotes duros y contactos con DND de
 *     correo. Escribirle a quien pidió que no le escribas es peor que no
 *     escribirle a nadie.
 *  3. Cada correo lleva SU enlace de baja, con el token propio de esa persona.
 *
 * El envío avanza por pasadas: cada corrida toma lo que sigue pendiente. Si se
 * cae a la mitad, la siguiente sigue donde iba sin repetir lo enviado.
 */

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Resend acepta hasta 100 por lote. */
const TAMANO_LOTE = 100;

/**
 * Intentos por correo antes de rendirse.
 *
 * Sin este tope, cada pasada del cron volvería a tomar los fallidos para
 * siempre — y una edición que nunca va a salir se quedaría "casi enviada"
 * eternamente.
 */
const MAX_INTENTOS = 3;

export type ResumenEnvio = {
  encolados: number;
  enviados: number;
  fallidos: number;
  excluidos: number;
  terminada: boolean;
};

/** Los correos a los que NO se les escribe por DND del CRM. */
async function correosConDnd(admin: Admin): Promise<Set<string>> {
  const fuera = new Set<string>();
  try {
    const { data } = await admin
      .from("contact_identities")
      .select("value, contacts!contact_id(dnd)")
      .eq("kind", "email");

    for (const fila of data ?? []) {
      const contacto = Array.isArray(fila.contacts) ? fila.contacts[0] : fila.contacts;
      const dnd = (contacto?.dnd ?? {}) as Record<string, unknown>;
      if (dnd.todos === true || dnd.email === true)
        fuera.add(String(fila.value).trim().toLowerCase());
    }
  } catch (err) {
    // Si el CRM no responde NO se manda el boletín a ciegas: mejor una corrida
    // sin envíos que escribirle a quien pidió que no.
    console.error("[boletín] no se pudo leer el DND del CRM", err);
    throw new Error("No se pudo comprobar quién pidió no recibir correo.");
  }
  return fuera;
}

/**
 * Arma (o completa) la cola de una edición.
 *
 * Es idempotente: los que ya están no se duplican, porque el unique de la base
 * los rechaza y aquí se insertan uno por uno ignorando esos choques.
 */
async function encolar(
  admin: Admin,
  editionId: string,
): Promise<{ encolados: number; excluidos: number }> {
  const [{ data: suscriptores }, dnd] = await Promise.all([
    admin
      .from("newsletter_subscribers")
      .select("id, email, status")
      .eq("status", "activo"),
    correosConDnd(admin),
  ]);

  const candidatos = (suscriptores ?? []).filter(
    (s) => !dnd.has(String(s.email).trim().toLowerCase()),
  );
  const excluidos = (suscriptores ?? []).length - candidatos.length;
  if (candidatos.length === 0) return { encolados: 0, excluidos };

  // Se insertan de golpe ignorando los que ya existían: el unique hace el
  // trabajo de deduplicar y no hace falta consultarlo antes.
  const { error } = await admin.from("newsletter_sends").upsert(
    candidatos.map((s) => ({
      edition_id: editionId,
      subscriber_id: s.id,
      email: String(s.email).trim().toLowerCase(),
      status: "encolado",
    })),
    { onConflict: "edition_id,email", ignoreDuplicates: true },
  );
  if (error) throw new Error(`No se pudo armar la lista: ${error.message}`);

  const { count } = await admin
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("edition_id", editionId);

  return { encolados: count ?? 0, excluidos };
}

/** Manda una edición programada. Se puede llamar varias veces sin duplicar. */
export async function enviarEdicion(
  admin: Admin,
  editionId: string,
): Promise<ResumenEnvio | { error: string }> {
  const { data: edicion } = await admin
    .from("newsletter_editions")
    .select("id, subject, html, status, approved_by, test_sent_at")
    .eq("id", editionId)
    .maybeSingle();
  if (!edicion) return { error: "Esa edición no existe." };

  // Se vuelven a mirar las compuertas aquí. La base ya las impone, pero este
  // código manda correo de verdad: no cuesta nada volver a preguntar.
  if (edicion.status !== "programada")
    return { error: `La edición está en "${edicion.status}", no programada.` };
  if (!edicion.approved_by) return { error: "Sin aprobación no se manda." };
  if (!edicion.test_sent_at) return { error: "Sin prueba enviada no se manda." };
  if (!edicion.html) return { error: "La edición no tiene correo armado." };

  let encolados = 0;
  let excluidos = 0;
  try {
    const cola = await encolar(admin, editionId);
    encolados = cola.encolados;
    excluidos = cola.excluidos;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo armar la lista." };
  }

  // Solo lo que sigue pendiente: lo encolado y lo que falló pero todavía tiene
  // intentos. Lo ya enviado no se vuelve a tocar nunca.
  const { data: pendientes } = await admin
    .from("newsletter_sends")
    .select(
      "id, email, attempts, subscriber_id, newsletter_subscribers!subscriber_id(unsubscribe_token)",
    )
    .eq("edition_id", editionId)
    .in("status", ["encolado", "fallido"])
    .lt("attempts", MAX_INTENTOS)
    .limit(TAMANO_LOTE);

  let enviados = 0;
  let fallidos = 0;

  if ((pendientes ?? []).length > 0) {
    const resend = getResend();
    const lote = (pendientes ?? []).map((p) => {
      const sus = Array.isArray(p.newsletter_subscribers)
        ? p.newsletter_subscribers[0]
        : p.newsletter_subscribers;
      const token = sus?.unsubscribe_token ?? "";
      return {
        filaId: p.id,
        email: p.email,
        intentos: p.attempts ?? 0,
        html: (edicion.html as string).replace(
          /\{\{ENLACE_BAJA\}\}/g,
          `${SITIO}/boletin/baja/${token}`,
        ),
      };
    });

    try {
      const { data, error } = await resend.batch.send(
        lote.map((l) => ({
          from: EMAIL_FROM,
          to: [l.email],
          subject: edicion.subject ?? "Boletín Club Pata Amiga",
          html: l.html,
        })),
      );

      if (error) throw new Error(error.message);

      // Resend devuelve los ids en el mismo orden del lote.
      const ids = (data?.data ?? []) as { id: string }[];
      for (let i = 0; i < lote.length; i++) {
        await admin
          .from("newsletter_sends")
          .update({
            status: "enviado",
            resend_id: ids[i]?.id ?? null,
            sent_at: new Date().toISOString(),
            error: null,
            attempts: lote[i].intentos + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lote[i].filaId);
        enviados++;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Resend rechazó el lote";
      for (const l of lote) {
        await admin
          .from("newsletter_sends")
          .update({
            status: "fallido",
            error: mensaje,
            attempts: l.intentos + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", l.filaId);
        fallidos++;
      }
    }
  }

  // ¿Queda algo por intentar en la siguiente pasada?
  const { count: faltan } = await admin
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("edition_id", editionId)
    .in("status", ["encolado", "fallido"])
    .lt("attempts", MAX_INTENTOS);

  const terminada = (faltan ?? 0) === 0;
  if (terminada) {
    // Salió = cualquier estado posterior al envío. Los webhooks mueven estas
    // filas a entregado/abierto/rebotado después.
    const { count: salieron } = await admin
      .from("newsletter_sends")
      .select("id", { count: "exact", head: true })
      .eq("edition_id", editionId)
      .in("status", ["enviado", "entregado", "abierto", "rebotado", "baja"]);
    const { count: totalFallidos } = await admin
      .from("newsletter_sends")
      .select("id", { count: "exact", head: true })
      .eq("edition_id", editionId)
      .eq("status", "fallido");

    // OJO: si NO salió ninguno, la edición queda 'fallida'. Marcarla como
    // enviada cuando no le llegó a nadie es la peor mentira que puede contar
    // esta pantalla — y nadie iría a revisarla.
    const salioAlguno = (salieron ?? 0) > 0;
    await admin
      .from("newsletter_editions")
      .update({ status: salioAlguno ? "enviada" : "fallida" })
      .eq("id", editionId);

    await notifyTeam(
      salioAlguno ? "notify_boletin_enviado" : "notify_boletin_fallido",
      salioAlguno
        ? `Boletín enviado: ${edicion.subject ?? "sin asunto"}`
        : `El boletín NO salió: ${edicion.subject ?? "sin asunto"}`,
      salioAlguno
        ? `<p>Salieron <strong>${salieron}</strong> correo(s).</p>
           ${totalFallidos ? `<p>${totalFallidos} no salieron tras ${MAX_INTENTOS} intentos.</p>` : ""}
           ${excluidos ? `<p>${excluidos} suscriptor(es) quedaron fuera por pedir no recibir correo.</p>` : ""}`
        : `<p>Ninguno de los ${totalFallidos ?? 0} correos salió tras ${MAX_INTENTOS} intentos. La edición quedó marcada como fallida.</p>`,
    ).catch(() => {});
  }

  return { encolados, enviados, fallidos, excluidos, terminada };
}

/**
 * Un evento de Resend movido a nuestra tabla.
 *
 * Un rebote DURO marca al suscriptor para no volver a intentarlo nunca: seguir
 * escribiendo a un buzón que no existe daña la reputación del dominio y por
 * ahí se cae el correo de todos los demás.
 */
export async function aplicarEventoResend(
  admin: Admin,
  evento: { type: string; data: { email_id?: string; bounce?: { type?: string } } },
): Promise<{ aplicado: boolean; detalle: string }> {
  const resendId = evento.data?.email_id;
  if (!resendId) return { aplicado: false, detalle: "El evento no trae email_id." };

  const { data: fila } = await admin
    .from("newsletter_sends")
    .select("id, subscriber_id")
    .eq("resend_id", resendId)
    .maybeSingle();
  // No es del boletín (puede ser un correo transaccional): se ignora sin ruido.
  if (!fila) return { aplicado: false, detalle: "No es un envío del boletín." };

  const nuevo =
    evento.type === "email.delivered"
      ? "entregado"
      : evento.type === "email.opened"
        ? "abierto"
        : evento.type === "email.bounced"
          ? "rebotado"
          : evento.type === "email.complained"
            ? "baja"
            : null;
  if (!nuevo) return { aplicado: false, detalle: `Evento ignorado: ${evento.type}` };

  await admin
    .from("newsletter_sends")
    .update({ status: nuevo, updated_at: new Date().toISOString() })
    .eq("id", fila.id);

  if (evento.type === "email.bounced" && fila.subscriber_id) {
    const duro = (evento.data?.bounce?.type ?? "").toLowerCase().includes("hard");
    if (duro)
      await admin
        .from("newsletter_subscribers")
        .update({ status: "rebote_duro", bounced_at: new Date().toISOString() })
        .eq("id", fila.subscriber_id);
  }

  // Una queja de spam es una baja en todo menos en el nombre.
  if (evento.type === "email.complained" && fila.subscriber_id)
    await admin
      .from("newsletter_subscribers")
      .update({ status: "baja", unsubscribed_at: new Date().toISOString() })
      .eq("id", fila.subscriber_id);

  return { aplicado: true, detalle: nuevo };
}

/** Da de baja por token. Sin sesión: el token ES la identificación. */
export async function darDeBajaPorToken(
  admin: Admin,
  token: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const { data } = await admin
    .from("newsletter_subscribers")
    .select("id, email, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!data) return { ok: false, error: "Ese enlace no corresponde a ninguna suscripción." };

  if (data.status !== "baja")
    await admin
      .from("newsletter_subscribers")
      .update({ status: "baja", unsubscribed_at: new Date().toISOString() })
      .eq("id", data.id);

  return { ok: true, email: data.email };
}
