import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend';
import { getCampaign, campaignCouponKey, campaignPdfSlot } from '@/lib/landings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Database not configured' },
                { status: 500, headers: corsHeaders() }
            );
        }

        const body = await request.json();
        const { campaign: campaignSlug, firstName, lastName, email, phone, consent, utm } = body;

        // Validaciones
        const campaign = getCampaign(campaignSlug);
        if (!campaign || !campaign.active) {
            return NextResponse.json(
                { success: false, error: 'Esta campaña ya no está activa.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const fName = firstName?.trim();
        const lName = lastName?.trim();
        const mail = email?.trim().toLowerCase();
        const tel = phone?.trim();

        if (!fName || !lName) {
            return NextResponse.json(
                { success: false, error: 'Escribe tu nombre y apellidos.' },
                { status: 400, headers: corsHeaders() }
            );
        }
        if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
            return NextResponse.json(
                { success: false, error: 'Revisa tu correo electrónico.' },
                { status: 400, headers: corsHeaders() }
            );
        }
        if (!tel || tel.replace(/\D/g, '').length < 10) {
            return NextResponse.json(
                { success: false, error: 'Escribe un teléfono válido (10 dígitos).' },
                { status: 400, headers: corsHeaders() }
            );
        }
        if (!consent) {
            return NextResponse.json(
                { success: false, error: 'Necesitamos tu consentimiento para enviarte el regalo.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // 1. Insertar el Lead en campaign_leads
        const { data: lead, error: insertError } = await supabase
            .from('campaign_leads')
            .insert({
                campaign: campaign.slug,
                first_name: fName,
                last_name: lName,
                email: mail,
                phone: tel,
                utm_source: utm?.source?.slice(0, 100) || null,
                utm_medium: utm?.medium?.slice(0, 100) || null,
                utm_campaign: utm?.campaign?.slice(0, 100) || null,
            })
            .select('id')
            .maybeSingle();

        if (insertError) {
            // Error de clave única (campaign, email): lead ya registrado
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { success: false, error: '¡Ya estás registrado! Revisa tu correo (y la carpeta de spam) — ahí está tu regalo.' },
                    { status: 409, headers: corsHeaders() }
                );
            }
            console.error('Error inserting campaign lead:', insertError);
            return NextResponse.json(
                { success: false, error: 'No pudimos registrarte. Intenta de nuevo.' },
                { status: 500, headers: corsHeaders() }
            );
        }

        const leadId = lead?.id;

        // 2. Consultar Cupón y PDF de la base de datos
        const [{ data: couponRow }, { data: pdfRow }] = await Promise.all([
            supabase
                .from('site_settings')
                .select('value')
                .eq('key', campaignCouponKey(campaign.slug))
                .maybeSingle(),
            supabase
                .from('site_assets')
                .select('url')
                .eq('slot', campaignPdfSlot(campaign.slug))
                .maybeSingle(),
        ]);

        const coupon = couponRow?.value?.trim();
        const pdfUrl = pdfRow?.url;

        const finalCoupon = coupon || 'MANADA10';
        const finalPdfUrl = pdfUrl || 'https://iddzylyvuhkhuvinvbou.supabase.co/storage/v1/object/public/site-assets/campaign-regalo-pdf-1784071291583.pdf';

        // 4. Enviar email usando Resend con el diseño exacto aprobado por el usuario
        let emailStatus = 'failed';
        if (resend) {
            try {
                const mailRes = await resend.emails.send({
                    from: `Club Pata Amiga <${DEFAULT_FROM_EMAIL}>`,
                    to: mail,
                    subject: campaign.emailSubject,
                    html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Obtén tu regalo — Club Pata Amiga</title></head><body style="margin:0;padding:0;"><!-- Correo "Obtén tu regalo" · Club Pata Amiga -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F1;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Encabezado con logo sobre teal -->
      <tr><td style="background-color:#1CBCAD;border-radius:20px 20px 0 0;padding:26px 20px;text-align:center;">
        <img src="https://iddzylyvuhkhuvinvbou.supabase.co/storage/v1/object/public/site-assets/email-header.png" width="180" alt="Club Pata Amiga" style="display:inline-block;width:180px;max-width:60%;height:auto;border-radius:12px;">
      </td></tr>

      <!-- Cuerpo -->
      <tr><td style="background-color:#FFFFFF;padding:34px 32px 10px;">
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#1E5350;">¡Tu regalo está aquí, ${fName}! 🎁</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3D524F;">Gracias por registrarte. Esto es lo que preparamos para ti y tu peludo:</p>
        <div style="background:#FDF9EF;border:2px dashed #1CBCAD;border-radius:14px;padding:16px;text-align:center;margin:8px 0"><span style="font-size:12px;color:#6B7C79;letter-spacing:.08em">TU CUPÓN DE DESCUENTO</span><br><span style="font-size:26px;font-weight:800;color:#1E5350;letter-spacing:.06em">${finalCoupon}</span></div>
        <p style="text-align:center;margin:16px 0"><a href="${finalPdfUrl}" style="background:#1CBCAD;color:#ffffff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none;display:inline-block">📘 Descargar tu guía de cuidado</a></p>
      </td></tr>

      <!-- Por qué unirte -->
      <tr><td style="background-color:#FFFFFF;padding:6px 32px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F1;border-radius:16px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 10px;font-size:14px;font-weight:bold;color:#1E5350;">Usa tu cupón al unirte a la manada — membresía de salud para tu perro o gato:</p>
            <p style="margin:0;font-size:13.5px;line-height:2;color:#3D524F;">
              🐾 Disponible en todo México<br>
              🐾 Mantienes a tu veterinario<br>
              🐾 Incluye hasta 3 mascotas<br>
              🐾 Orientación veterinaria 24/7<br>
              🐾 100% digital
            </p>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="background-color:#FFFFFF;padding:22px 32px 34px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td style="background-color:#1E5350;border-radius:999px;">
            <a href="https://app.pataamiga.mx/registro?step=1" style="display:inline-block;padding:15px 36px;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;">Unirme a la manada</a>
          </td></tr>
        </table>
        <p style="margin:14px 0 0;font-size:12px;color:#8A9490;">Membresía desde $159 MXN al mes · No es un seguro</p>
      </td></tr>

      <!-- Pie -->
      <tr><td style="background-color:#1E5350;border-radius:0 0 20px 20px;padding:24px 32px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#FFFFFF;">Club Pata Amiga · Protección para tu manada</p>
        <p style="margin:0 0 10px;font-size:12px;line-height:1.7;color:#BFD9D6;">
          ¿Dudas? Escríbenos a <a href="mailto:soporte@pataamiga.mx" style="color:#A6CE39;text-decoration:none;">soporte@pataamiga.mx</a><br>
          <a href="https://www.instagram.com/pataamigamx" style="color:#BFD9D6;text-decoration:underline;">Instagram</a> &nbsp;·&nbsp;
          <a href="https://www.facebook.com/share/14YQRpe9WzS/" style="color:#BFD9D6;text-decoration:underline;">Facebook</a> &nbsp;·&nbsp;
          <a href="https://www.tiktok.com/@pataamigamx" style="color:#BFD9D6;text-decoration:underline;">TikTok</a>
        </p>
        <p style="margin:0;font-size:10.5px;line-height:1.6;color:#8FB5B1;">
          Recibiste este correo porque te registraste para recibir tu regalo de bienvenida.<br>
          Si no fuiste tú, puedes ignorar este mensaje.<br>
          GIRBAZ, S.A. de C.V. y PATA AMIGA, A.C. · Hecho con ♡ en México
        </p>
      </td></tr>

    </table>
  </td></tr>
</table></body></html>`
                });

                if (mailRes.data?.id) {
                    emailStatus = 'sent';
                }
            } catch (mailError) {
                console.error('Error sending campaign gift email:', mailError);
            }
        }

        // 5. Actualizar el estado del correo en la base de datos
        if (leadId) {
            await supabase
                .from('campaign_leads')
                .update({
                    gift_email_status: emailStatus,
                    gift_email_sent_at: emailStatus === 'sent' ? new Date().toISOString() : null
                })
                .eq('id', leadId);
        }

        return NextResponse.json({
            success: true,
            message: 'Registro exitoso y correo de regalo en proceso de envío.'
        }, { headers: corsHeaders() });

    } catch (error) {
        console.error('Campaign Lead submission error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
