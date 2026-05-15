import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, rejection_reason } = await request.json();

    try {
        const { data, error } = await supabaseAdmin
            .from('wellness_centers')
            .update({ 
                status, 
                rejection_reason: status === 'rejected' ? rejection_reason : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('email, establishment_name, status, memberstack_id')
            .single();

        if (error) throw error;

        // 2. Notificación en Dashboard para el aliado
        await supabaseAdmin.from('notifications').insert({
            user_id: data.memberstack_id,
            type: 'wellness_status_update',
            title: status === 'approved' ? '¡Felicidades! Cuenta aprobada' : 'Actualización de tu solicitud',
            message: status === 'approved' 
                ? `Tu centro ${data.establishment_name} ha sido aprobado.` 
                : `Tu solicitud para ${data.establishment_name} ha sido rechazada.`,
            icon: status === 'approved' ? '🎉' : '⚠️',
            data: { wellness_center_id: id, status },
            is_read: false
        });

        // Enviar notificación por email
        if (resend && data.email) {
            const isApproved = status === 'approved';
            const subject = isApproved 
                ? '¡Bienvenido a Pata Amiga! - Centro de Bienestar Aprobado' 
                : 'Actualización sobre tu solicitud - Pata Amiga';
            
            const html = isApproved 
                ? `
                    <h1>¡Felicidades ${data.establishment_name}!</h1>
                    <p>Tu solicitud para ser parte de nuestra red de Centros de Bienestar ha sido <strong>aprobada</strong>.</p>
                    <p>Ya puedes acceder a tu panel para gestionar citas y aparecer en nuestro directorio.</p>
                    <a href="https://pataamiga.mx/bienestar/login" style="background: #FE8F15; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none;">Ir al Dashboard</a>
                `
                : `
                    <h1>Hola ${data.establishment_name}</h1>
                    <p>Lamentamos informarte que tu solicitud no ha sido aprobada en esta ocasión.</p>
                    ${rejection_reason ? `<p><strong>Motivo:</strong> ${rejection_reason}</p>` : ''}
                    <p>Si crees que esto es un error, puedes apelar la decisión desde tu panel de control.</p>
                    <a href="https://pataamiga.mx/bienestar/estado" style="background: #00BBB4; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none;">Ver Estado</a>
                `;

            await resend.emails.send({
                from: `Club Pata Amiga <${DEFAULT_FROM_EMAIL}>`,
                to: data.email,
                subject: subject,
                html: html
            });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('❌ Error updating status/sending email:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
