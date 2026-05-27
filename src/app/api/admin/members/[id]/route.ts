import { NextRequest, NextResponse } from 'next/server';
import { getMemberDetails, updateMemberData, triggerVerificationEmail, memberstackAdmin } from '@/services/memberstack-admin.service';
import { getUserDataByMemberstackId, updateUserEmailInSupabase } from '@/app/actions/user.actions';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { commService } from '@/services/comm.service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Validar que el usuario sea admin
        const { id: memberId } = await params;
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('refresh') === 'true';

        console.log(`📋 Obteniendo detalles de miembro ${memberId}...${forceRefresh ? ' (FORCE REFRESH)' : ''}`);

        // 1. Invalidar caché si se solicita refresco forzado
        if (forceRefresh) {
            memberstackAdmin.invalidateCache();
            console.log(`🗑️ Caché invalidada para miembro ${memberId}`);
        }

        // 2. Obtener datos de Memberstack
        const result = await getMemberDetails(memberId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        const member = result.data;

        if (!member) {
            return NextResponse.json(
                { error: 'Miembro no encontrado' },
                { status: 404 }
            );
        }

        // 2. Obtener datos de Supabase para complementar la dirección y otros campos
        try {
            const supabaseResult = await getUserDataByMemberstackId(memberId);
            if (supabaseResult.success && supabaseResult.userData) {
                const userData = supabaseResult.userData;

                // Mapear campos de Supabase a customFields de Memberstack para compatibilidad con el modal
                member.customFields = {
                    ...member.customFields,
                    'address': userData.address || member.customFields['address'],
                    'colony': userData.colony || member.customFields['colony'],
                    'city': userData.city || member.customFields['city'],
                    'state': userData.state || member.customFields['state'],
                    'postal-code': userData.postal_code || member.customFields['postal-code'],
                    'phone': userData.phone || member.customFields['phone'],
                    'curp': userData.curp || member.customFields['curp'],
                    'ine-front-url': userData.ine_front_url || member.customFields['ine-front-url'],
                    'ine-back-url': userData.ine_back_url || member.customFields['ine-back-url'],
                };

                console.log(`✅ Datos de Supabase combinados para ${memberId}`);
            }
        } catch (supabaseError) {
            console.warn(`⚠️ Error al obtener datos de Supabase para ${memberId}:`, supabaseError);
            // Continuamos aunque falle Supabase para no romper el modal
        }

        return NextResponse.json({
            success: true,
            member: member,
        });

    } catch (error: any) {
        console.error('Error obteniendo detalles de miembro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

        console.log(`🔄 Actualizando email de miembro ${memberId} a: ${email}`);

        // 1. Actualizar en Memberstack
        const msUpdateResult = await updateMemberData(memberId, {
            auth: { email }
        });

        if (!msUpdateResult.success) {
            return NextResponse.json(
                { error: `Error en Memberstack: ${msUpdateResult.error}` },
                { status: 500 }
            );
        }

        // 2. Disparar email de verificación (opcional pero recomendado tras cambio)
        await triggerVerificationEmail(memberId);

        // 3. Actualizar en Supabase
        const supabaseResult = await updateUserEmailInSupabase(memberId, email);
        
        if (!supabaseResult.success) {
            console.error('⚠️ Desincronización: Email actualizado en MS pero falló en Supabase');
        }

        // 4. Notificar al usuario en el widget
        await commService.sendInAppNotification({
            user_id: memberId,
            type: 'account',
            title: 'Correo Electrónico Actualizado',
            message: `Un administrador ha actualizado tu correo electrónico a: ${email}. Se ha enviado un enlace de verificación a tu nueva dirección.`,
            icon: '📧',
            metadata: { field: 'email', newValue: email }
        });

        return NextResponse.json({
            success: true,
            message: 'Email actualizado y correo de verificación enviado'
        });

    } catch (error: any) {
        console.error('Error actualizando miembro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
