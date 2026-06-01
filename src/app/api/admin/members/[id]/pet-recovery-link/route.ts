import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendAdminEmail } from '@/app/actions/comm.actions';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const TOKEN_EXPIRY_MINUTES = 60;

function buildPetRecoveryEmailHtml(userName: string, recoveryUrl: string) {
    const firstName = userName || 'Hola';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Completa la informacion de tu mascota</title></head><body style="margin:0;padding:0;background-color:#F7F8FA;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:#7DD8D5;padding:36px 40px;text-align:center;"><img src="https://app.pataamiga.mx/Identidad/logo-pata-amiga-azul.png" alt="Club Pata Amiga" height="44" style="display:block;margin:0 auto 16px;"/><p style="margin:0;color:#2D3748;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Accion requerida</p></td></tr><tr><td style="padding:40px 40px 24px;"><h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#2D3748;line-height:1.3;">${firstName}, necesitamos los datos de tu mascota</h1><p style="margin:0 0 20px;font-size:16px;color:#4A5568;line-height:1.7;">Tu membresia ya aparece en nuestro sistema, pero aun falta completar la informacion de tu mascota para que el equipo pueda revisar tu expediente.</p><div style="background:#FFFBF5;border:1.5px solid #FEE4C4;border-radius:16px;padding:20px;margin-bottom:28px;"><p style="margin:0;font-size:14px;color:#4A5568;line-height:1.6;">El enlace te llevara al registro de mascota y despues a la ficha completa de la mascota. No tendras que seleccionar plan ni volver a pagar.</p></div><div style="text-align:center;margin-bottom:28px;"><a href="${recoveryUrl}" style="display:inline-block;background:#FE8F15;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;border:2px solid #000000;box-shadow:0 4px 14px rgba(254,143,21,0.35);">Completar datos de mi mascota</a></div><p style="margin:0 0 8px;font-size:13px;color:#718096;text-align:center;line-height:1.6;">Este enlace es seguro y vence en ${TOKEN_EXPIRY_MINUTES} minutos.</p><p style="margin:0;font-size:13px;color:#A0AEC0;text-align:center;line-height:1.6;">Si el boton no abre, usa este enlace: <a href="${recoveryUrl}" style="color:#00BBB4;font-weight:600;text-decoration:none;">completar mascota</a></p></td></tr><tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EDF2F7;margin:0;"/></td></tr><tr><td style="padding:24px 40px 36px;text-align:center;"><p style="margin:0 0 8px;font-size:13px;color:#718096;">Con carino, <strong style="color:#2D3748;">El equipo de Club Pata Amiga</strong></p><p style="margin:0;font-size:11px;color:#A0AEC0;">Si tienes dudas, responde este correo y te ayudamos.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, first_name, last_name, memberstack_id')
            .eq('memberstack_id', memberId)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (!user.email) {
            return NextResponse.json({ error: 'El usuario no tiene email registrado' }, { status: 400 });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

        const { error: tokenError } = await supabaseAdmin
            .from('magic_tokens')
            .insert({
                token,
                memberstack_id: memberId,
                email: user.email.toLowerCase().trim(),
                custom_fields: { source: 'admin_pet_recovery_link' },
                intent: 'complete_pet_info',
                expires_at: expiresAt.toISOString(),
                used: false,
            });

        if (tokenError) {
            console.error('[PetRecoveryLink] Error creando magic token:', tokenError);
            return NextResponse.json({ error: 'Error generando magic link' }, { status: 500 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.pataamiga.mx';
        const recoveryUrl = `${baseUrl}/registro?mt=${encodeURIComponent(token)}&reason=complete_pet_info&email=${encodeURIComponent(user.email)}`;
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const content = `Hola ${userName || ''}, necesitamos que completes la informacion de tu mascota para revisar tu membresia. Usa este enlace seguro: ${recoveryUrl}`;

        const emailResult = await sendAdminEmail({
            userId: user.id,
            adminId: adminUser.memberstack_id,
            templateId: 'admin_pet_recovery_link',
            to: user.email,
            subject: 'Completa los datos de tu mascota',
            content,
            html: buildPetRecoveryEmailHtml(userName, recoveryUrl),
            audience: 'member',
            memberName: userName || 'Miembro',
            metadata: {
                memberstackId: memberId,
                intent: 'complete_pet_info',
                expiresAt: expiresAt.toISOString(),
            },
        });

        if (!emailResult.success) {
            return NextResponse.json({
                success: false,
                error: emailResult.error || 'No se pudo enviar el email',
                recoveryUrl,
            }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            message: `Link enviado a ${user.email}`,
            recoveryUrl,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error: unknown) {
        console.error('[PetRecoveryLink] Error:', error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
