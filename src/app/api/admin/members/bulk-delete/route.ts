import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/members/bulk-delete
 * Elimina múltiples miembros simultáneamente
 */
export async function POST(request: NextRequest) {
    try {
        // 🔒 SEGURIDAD: Validar que el usuario es admin en el servidor
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const adminName = adminUser.full_name || 'Admin';
        const adminId = adminUser.memberstack_id;

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Se requiere un array de IDs' }, { status: 400 });
        }

        console.log(`🚀 [BULK] Iniciando eliminación masiva de ${ids.length} usuarios por admin ${adminName}`);

        const results = {
            successCount: 0,
            failedCount: 0,
            errors: [] as any[]
        };

        // Procesar en lotes o secuencialmente para evitar timeouts pesados
        for (const msId of ids) {
            try {
                // 1. Lógica de Supabase
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('id, stripe_customer_id, email, first_name, last_name, mother_last_name, memberstack_id')
                    .or(`memberstack_id.eq.${msId},id.eq.${msId}`)
                    .maybeSingle();

                // Obtener nombre y correo para auditoría antes de la eliminación
                const userName = user 
                    ? `${user.first_name || ''} ${user.last_name || ''} ${user.mother_last_name || ''}`.trim() 
                    : 'Usuario Desconocido';
                const userEmail = user?.email || 'email@desconocido.com';

                // Registrar en logs de eliminación
                await supabaseAdmin
                    .from('member_deletions')
                    .insert({
                        member_id: msId,
                        member_name: userName,
                        member_email: userEmail,
                        deleted_by_name: adminName,
                        deleted_by_id: adminId
                    });

                if (user) {
                    // 1.5. Borrar dependencias directas para evitar Foreign Key constraints
                    await supabaseAdmin.from('appeal_logs').delete().eq('user_id', msId);
                    await supabaseAdmin.from('appeal_logs').delete().eq('user_id', user.id);
                    await supabaseAdmin.from('notifications').delete().eq('user_id', msId);
                    await supabaseAdmin.from('notifications').delete().eq('user_id', user.id);

                    // Borrar Mascotas (los archivos los dejamos para no saturar si es masivo, 
                    // o intentamos borrar solo si hay pocos. Para simplificar borramos registros).
                    // Pero el usuario pidió "fotos y todo". Hagamos un intento rápido.
                    
                    const { data: pets } = await supabaseAdmin
                        .from('pets')
                        .select('id, photo_url')
                        .eq('owner_id', user.id);
                    
                    if (pets) {
                        const petIds = pets.map(p => p.id);
                        if (petIds.length > 0) {
                            await supabaseAdmin.from('appeal_logs').delete().in('pet_id', petIds);
                        }

                        const photoPaths = pets
                            .map(p => p.photo_url?.split('/').pop())
                            .filter(Boolean) as string[];
                        
                        if (photoPaths.length > 0) {
                            await supabaseAdmin.storage.from('pet-photos').remove(photoPaths);
                        }
                    }

                    await supabaseAdmin.from('pets').delete().eq('owner_id', user.id);
                    await supabaseAdmin.from('users').delete().eq('id', user.id);
                }

                // Cancelar suscripciones activas en Stripe
                try {
                    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
                    let stripeCustomerId = user?.stripe_customer_id;

                    if (!stripeCustomerId && user?.email) {
                        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                        if (customers.data.length > 0) stripeCustomerId = customers.data[0].id;
                    }

                    if (stripeCustomerId) {
                        const [activeSubs, trialingSubs] = await Promise.all([
                            stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 10 }),
                            stripe.subscriptions.list({ customer: stripeCustomerId, status: 'trialing', limit: 10 }),
                        ]);
                        const allSubs = [...activeSubs.data, ...trialingSubs.data];
                        for (const sub of allSubs) {
                            await stripe.subscriptions.cancel(sub.id);
                            console.log(`✅ [BULK] Suscripción ${sub.id} cancelada para ${msId}`);
                        }
                    }
                } catch (stripeError: any) {
                    console.error(`❌ [BULK][CRÍTICO] Error cancelando Stripe para ${msId}:`, stripeError.message);
                }

                // 2. Memberstack
                const msResult = await memberstackAdmin.deleteMember(msId);
                
                if (msResult.success) {
                    results.successCount++;
                } else {
                    results.failedCount++;
                    results.errors.push({ id: msId, error: msResult.error });
                }
            } catch (err: any) {
                results.failedCount++;
                results.errors.push({ id: msId, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            ...results
        });

    } catch (error: any) {
        console.error('Error en bulk-delete:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
