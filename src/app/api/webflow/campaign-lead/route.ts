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

        // 3. Construir bloques HTML para el correo
        const couponBlock = coupon
            ? `<div style="background:#FFF8E1; border:2px dashed #FE8F15; border-radius:14px; padding:20px; text-align:center; margin:24px 0;">
                <span style="font-size:12px; color:#718096; letter-spacing:0.1em; font-weight:bold;">TU CUPÓN DE DESCUENTO</span><br>
                <span style="font-size:28px; font-weight:800; color:#2D3748; letter-spacing:0.05em;">${coupon}</span>
               </div>`
            : `<div style="background:#F7FAFC; border-radius:14px; padding:16px; text-align:center; margin:20px 0; color:#718096; font-size:14px;">
                Tu cupón de descuento de membresía está por activarse. ¡Te lo enviaremos muy pronto! 🐾
               </div>`;

        const pdfBlock = pdfUrl
            ? `<div style="text-align:center; margin:28px 0;">
                <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" style="background:#00BBB4; color:#ffffff; padding:16px 32px; border-radius:50px; font-weight:bold; font-size:16px; text-decoration:none; display:inline-block; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000;">
                  📘 Descargar tu guía de cuidado
                </a>
               </div>`
            : `<p style="text-align:center; color:#718096; font-size:14px; margin:24px 0;">
                📘 Tu guía de cuidado (PDF) llegará a este mismo correo en los próximos días.
               </p>`;

        // 4. Enviar email usando Resend
        let emailStatus = 'failed';
        if (resend) {
            try {
                const mailRes = await resend.emails.send({
                    from: `Club Pata Amiga <${DEFAULT_FROM_EMAIL}>`,
                    to: mail,
                    subject: campaign.emailSubject,
                    html: `
                        <div style="font-family:'Outfit',sans-serif,system-ui; max-width:600px; margin:0 auto; padding:24px; border:2px solid #000000; border-radius:24px; background:#FFFFFF; box-shadow: 6px 6px 0px #000000;">
                            <div style="text-align:center; margin-bottom:24px;">
                                <span style="font-size:40px;">🎁</span>
                                <h1 style="color:#2D3748; font-size:26px; font-weight:bold; margin-top:12px; margin-bottom:4px;">¡Tu regalo está aquí!</h1>
                                <p style="color:#718096; font-size:14px; margin:0;">Club Pata Amiga</p>
                            </div>
                            <div style="color:#2D3748; font-size:15px; line-height:1.6; margin-bottom:24px;">
                                <p>¡Hola, <strong>${fName}</strong>!</p>
                                <p>Gracias por registrarte para recibir tu regalo de bienvenida en nuestra landing page. Nos alegra mucho darte la bienvenida a nuestra manada de cuidado para mascotas.</p>
                                
                                ${couponBlock}
                                
                                ${pdfBlock}
                                
                                <p>Si estás listo para asegurar la salud de tu peludo con orientación veterinaria 24/7 y reembolsos para sus gastos de salud, puedes darte de alta aquí:</p>
                                <div style="text-align:center; margin:20px 0;">
                                    <a href="https://app.pataamiga.mx/registro?step=1" target="_blank" rel="noopener noreferrer" style="background:#FE8F15; color:#ffffff; padding:12px 24px; border-radius:50px; font-weight:bold; text-decoration:none; display:inline-block; border: 2px solid #000000; box-shadow: 3px 3px 0px #000000;">
                                        Registrar a mi mascota 🐾
                                    </a>
                                </div>
                            </div>
                            <hr style="border:none; border-top:1px solid #E2E8F0; margin:24px 0;">
                            <div style="text-align:center; font-size:12px; color:#A0AEC0; line-height:1.5;">
                                <p>Este correo fue enviado automáticamente por Club Pata Amiga.<br>Si tienes alguna duda, escríbenos a <a href="mailto:soporte@pataamiga.mx" style="color:#00BBB4; text-decoration:none; font-weight:bold;">soporte@pataamiga.mx</a>.</p>
                            </div>
                        </div>
                    `
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
