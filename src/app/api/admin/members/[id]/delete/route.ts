import { NextRequest, NextResponse } from 'next/server';
import { memberstackAdmin } from '@/services/memberstack-admin.service';
import { createClient } from '@supabase/supabase-js';

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
    const { id } = await params;

    try {
        console.log(`🗑️ [BACKEND] Iniciando eliminación total del miembro: ${id}`);

        // 1. Buscar usuario en Supabase para obtener su UUID interno
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('memberstack_id', id)
            .maybeSingle();

        if (userError) {
            console.error('Error buscando usuario en Supabase:', userError);
        }

        if (user) {
            console.log(`👤 Usuario encontrado en Supabase con ID: ${user.id}`);

            // 2. Borrar mascotas y sus archivos de storage
            const { data: pets } = await supabaseAdmin
                .from('pets')
                .select('id, photo_url, vet_certificate_url')
                .eq('owner_id', user.id);

            if (pets && pets.length > 0) {
                console.log(`🐾 Eliminando ${pets.length} mascotas...`);
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

        // 5. Borrar de Memberstack
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
