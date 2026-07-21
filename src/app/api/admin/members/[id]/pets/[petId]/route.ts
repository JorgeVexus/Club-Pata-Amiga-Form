import { NextRequest, NextResponse } from 'next/server';
import { updateMemberData } from '@/services/memberstack-admin.service';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; petId: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId, petId } = await params;
        const body = await request.json();

        const {
            // Campos de mascota
            name,
            breed,
            petType,      // 'dog' | 'cat'
            gender,       // 'macho' | 'hembra'
            ageValue,
            ageUnit,      // 'months' | 'years'
            isAdopted,
            isSenior,
            isMixedBreed,
            // Slot de Memberstack (1, 2, o 3)
            msIndex,
            // Para logging
            petName,      // nombre actual (para el mensaje del log)
            memberName,
            changes,      // { fieldKey: { old, new } }
        } = body;

        if (!msIndex) {
            return NextResponse.json({ error: 'msIndex es requerido' }, { status: 400 });
        }

        const adminId = adminUser.memberstack_id;
        const adminName = adminUser.full_name || adminUser.email || 'Admin';

        console.log(`🐾 Admin ${adminName} editando mascota ${petId} (slot ${msIndex}) del miembro ${memberId}`);

        // ── 1. Memberstack — solo los campos que existen allá ─────────────────────
        // Disponibles: pet-N-name, pet-N-type, pet-N-age
        const msFields: Record<string, any> = {};
        if (name !== undefined)    msFields[`pet-${msIndex}-name`] = name;
        if (petType !== undefined) msFields[`pet-${msIndex}-type`] = petType;
        if (ageValue !== undefined) {
            // MS guarda la edad como string descriptivo: "3 años" o "6 meses"
            const unit = ageUnit || 'years';
            msFields[`pet-${msIndex}-age`] = `${ageValue} ${unit === 'months' ? 'meses' : 'años'}`;
        }

        if (Object.keys(msFields).length > 0) {
            const msResult = await updateMemberData(memberId, { customFields: msFields });
            if (!msResult.success) {
                return NextResponse.json(
                    { error: `Error en Memberstack: ${msResult.error}` },
                    { status: 500 }
                );
            }
        }

        // ── 2. Supabase — todos los campos de la tabla pets ──────────────────────
        const supabaseFields: Record<string, any> = {};
        if (name !== undefined)          supabaseFields.name          = name;
        if (breed !== undefined)         supabaseFields.breed         = breed;
        if (petType !== undefined)       supabaseFields.pet_type      = petType;
        if (gender !== undefined)        supabaseFields.gender        = gender;
        if (ageValue !== undefined)      supabaseFields.age_value     = String(ageValue);
        if (ageUnit !== undefined)       supabaseFields.age_unit      = ageUnit;
        if (isAdopted !== undefined)     supabaseFields.is_adopted    = isAdopted;
        if (isSenior !== undefined)      supabaseFields.is_senior     = isSenior;
        if (isMixedBreed !== undefined)  supabaseFields.is_mixed_breed = isMixedBreed;

        if (Object.keys(supabaseFields).length > 0) {
            const { error: supaErr } = await supabaseAdmin
                .from('pets')
                .update(supabaseFields)
                .eq('id', petId);

            if (supaErr) {
                console.error('⚠️ Error actualizando mascota en Supabase:', supaErr.message);
                return NextResponse.json({ error: `Error en Supabase: ${supaErr.message}` }, { status: 500 });
            }
        }

        // ── 3. Registrar en member_edits ─────────────────────────────────────────
        const displayPetName = name || petName || `Mascota ${msIndex}`;

        const { error: editLogErr } = await supabaseAdmin
            .from('member_edits')
            .insert({
                member_id: memberId,
                member_name: memberName || memberId,
                pet_id: petId,
                pet_name: displayPetName,
                edited_by_id: adminId || 'admin',
                edited_by_name: adminName,
                changes: changes || supabaseFields,
                edit_type: 'pet_data',
                created_at: new Date().toISOString(),
            });

        if (editLogErr) {
            console.warn('⚠️ No se pudo registrar el log de edición (tabla member_edits puede no existir):', editLogErr.message);
        }

        // ── 4. Registrar en appeal_logs (historial del chat en el modal) ─────────
        const fieldLabels: Record<string, string> = {
            name: 'Nombre', breed: 'Raza', pet_type: 'Tipo', gender: 'Sexo',
            age_value: 'Edad', age_unit: 'Unidad de Edad',
            is_adopted: 'Adoptado', is_senior: 'Senior', is_mixed_breed: 'Mestizo',
        };
        const changedFieldsList = Object.keys(changes || supabaseFields);
        const changedLabels = changedFieldsList.map(k => fieldLabels[k] || k).join(', ');

        if (changedLabels) {
            await supabaseAdmin.from('appeal_logs').insert({
                user_id: memberId,
                pet_id: petId,
                admin_id: adminId || 'admin',
                type: 'admin_edit',
                message: `✏️ ${adminName} actualizó datos de ${displayPetName}. Campos modificados: ${changedLabels}.`,
                metadata: { edit_type: 'pet_data', changes: changes || supabaseFields },
                created_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            message: `Datos de ${displayPetName} actualizados correctamente`,
        });

    } catch (error: any) {
        console.error('Error actualizando mascota:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
