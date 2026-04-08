import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';

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
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Se requiere un array de IDs' }, { status: 400 });
        }

        console.log(`🚀 [BULK] Iniciando eliminación masiva de ${ids.length} usuarios`);

        const results = {
            successCount: 0,
            failedCount: 0,
            errors: [] as any[]
        };

        // Procesar en lotes o secuencialmente para evitar timeouts pesados
        // Para pruebas, secuencial está bien por ahora
        for (const msId of ids) {
            try {
                // 1. Lógica de Supabase
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('memberstack_id', msId)
                    .maybeSingle();

                if (user) {
                    // Borrar Mascotas (los archivos los dejamos para no saturar si es masivo, 
                    // o intentamos borrar solo si hay pocos. Para simplificar borramos registros).
                    // Pero el usuario pidió "fotos y todo". Hagamos un intento rápido.
                    
                    const { data: pets } = await supabaseAdmin
                        .from('pets')
                        .select('photo_url')
                        .eq('owner_id', user.id);
                    
                    if (pets) {
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
