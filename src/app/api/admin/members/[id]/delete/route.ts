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
 * DELETE /api/admin/members/[id]/delete
 * Elimina un miembro de Memberstack y todos sus datos en Supabase (Usuario, Mascotas, Archivos)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminUser = await getAdminUser(request);
    if (!adminUser) return unauthorizedResponse();

    const { id } = await params;

    try {
        console.log(`🗑️ [BACKEND] Iniciando eliminación total del miembro: ${id}`);

        // 1. Buscar usuario en Supabase para obtener su UUID interno y datos de Stripe
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, role, stripe_customer_id, email')
            .eq('memberstack_id', id)
            .maybeSingle();

        if (userError) {
            console.error('Error buscando usuario en Supabase:', userError);
        }

        if (user) {
            console.log(`👤 Usuario encontrado en Supabase con ID: ${user.id}`);

            // 1.5. Borrar dependencias directas para evitar Foreign Key constraints
            await supabaseAdmin.from('appeal_logs').delete().eq('user_id', id);
            await supabaseAdmin.from('appeal_logs').delete().eq('user_id', user.id);
            await supabaseAdmin.from('notifications').delete().eq('user_id', id);
            await supabaseAdmin.from('notifications').delete().eq('user_id', user.id);

            // 2. Borrar mascotas y sus archivos de storage
            const { data: pets } = await supabaseAdmin
                .from('pets')
                .select('id, photo_url, vet_certificate_url')
                .eq('owner_id', user.id);

            if (pets && pets.length > 0) {
                console.log(`🐾 Eliminando ${pets.length} mascotas...`);
                
                // Borrar appeal_logs que hagan referencia al pet_id
                const petIds = pets.map(p => p.id);
                if (petIds.length > 0) {
                    await supabaseAdmin.from('appeal_logs').delete().in('pet_id', petIds);
                }

                for (const pet of pets) {
                    // Borrar foto de mascota
                    if (pet.photo_url) {
                        try {
                            const fileName = pet.photo_url.split('/').pop();
                            if (fileName) {
                                await supabaseAdmin.storage.from('pet-photos').remove([fileName]);
                                console.log(`📸 Foto eliminada: ${fileName}`);
                            }
                        } catch (err) { console.error('Error eliminando foto:', err); }
                    }
                    
                    // Borrar certificado veterinario
                    if (pet.vet_certificate_url) {
                        try {
                            const fileName = pet.vet_certificate_url.split('/').pop();
                            if (fileName) {
                                await supabaseAdmin.storage.from('vet-certificates').remove([fileName]);
                            }
                        } catch (err) { console.error('Error eliminando certificado:', err); }
                    }
                }
                
                // Borrar registros de mascotas en DB
                const { error: petsDeleteError } = await supabaseAdmin
                    .from('pets')
                    .delete()
                    .eq('owner_id', user.id);
                
                if (petsDeleteError) console.error('Error eliminando mascotas de DB:', petsDeleteError);
            }

            // 3. Intentar borrar documentos del usuario (INE, Comprobante)
            // Nota: En una implementación ideal, guardaríamos los paths, 
            // pero aquí intentaremos borrar si el nombre del archivo contiene el ID o consultando Memberstack.
            // Como Memberstack ya será borrado, lo hacemos antes si es posible o asumimos que el user tiene los campos.
            
            // 4. Borrar usuario de Supabase
            console.log('🚮 Eliminando usuario de Supabase...');
            const { error: userDeleteError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', user.id);
            
            if (userDeleteError) {
                console.error('Error eliminando usuario de Supabase:', userDeleteError);
            }
        } else {
            console.log('ℹ️ Usuario no encontrado en Supabase, procediendo solo con Memberstack');
        }

        // 5. Cancelar suscripciones activas en Stripe ANTES de borrar el miembro
        console.log('💳 Cancelando suscripciones en Stripe...');
        try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
            let stripeCustomerId = user?.stripe_customer_id;

            // Si no tenemos el customer_id guardado, buscarlo por email en Stripe
            if (!stripeCustomerId && user?.email) {
                const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id;
                }
            }

            if (stripeCustomerId) {
                // Buscar todas las suscripciones activas o en prueba
                const subscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomerId,
                    status: 'active',
                    limit: 10,
                });

                // También buscar suscripciones con estado 'trialing'
                const trialingSubscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomerId,
                    status: 'trialing',
                    limit: 10,
                });

                const allSubs = [...subscriptions.data, ...trialingSubscriptions.data];

                if (allSubs.length > 0) {
                    console.log(`🔴 Cancelando ${allSubs.length} suscripción(es) activa(s) de Stripe para customer: ${stripeCustomerId}`);
                    for (const sub of allSubs) {
                        await stripe.subscriptions.cancel(sub.id);
                        console.log(`✅ Suscripción ${sub.id} cancelada inmediatamente.`);
                    }
                } else {
                    console.log(`ℹ️ No se encontraron suscripciones activas en Stripe para customer: ${stripeCustomerId}`);
                }
            } else {
                console.log('ℹ️ No se encontró Stripe customer ID, omitiendo cancelación de suscripciones.');
            }
        } catch (stripeError: any) {
            // No bloqueamos el borrado si falla Stripe, pero sí lo logueamos como error crítico
            console.error('❌ [CRÍTICO] Error cancelando suscripciones en Stripe:', stripeError.message);
        }

        // 6. Borrar de Memberstack
        console.log('📤 Eliminando de Memberstack...');
        const msResult = await memberstackAdmin.deleteMember(id);

        if (!msResult.success) {
            console.error('❌ Error eliminando de Memberstack:', msResult.error);
            return NextResponse.json({ error: msResult.error }, { status: 500 });
        }

        console.log('✅ Eliminación completada con éxito');
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('💥 Error crítico en DELETE /api/admin/members/[id]/delete:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
