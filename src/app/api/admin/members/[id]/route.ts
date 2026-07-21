import { NextRequest, NextResponse } from 'next/server';
import { getMemberDetails, updateMemberData, memberstackAdmin } from '@/services/memberstack-admin.service';
import { getUserDataByMemberstackId } from '@/app/actions/user.actions';
import { getAdminUser, unauthorizedResponse } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getRegistrationIssue } from '@/utils/registration-completeness';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: memberId } = await params;
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('refresh') === 'true';

        console.log(`📋 Obteniendo detalles de miembro ${memberId}...${forceRefresh ? ' (FORCE REFRESH)' : ''}`);

        if (forceRefresh) {
            memberstackAdmin.invalidateCache();
            console.log(`🗑️ Caché invalidada para miembro ${memberId}`);
        }

        const result = await getMemberDetails(memberId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        const member = result.data;

        if (!member) {
            return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
        }

        try {
            const supabaseResult = await getUserDataByMemberstackId(memberId);
            if (supabaseResult.success && supabaseResult.userData) {
                const userData = supabaseResult.userData;
                let petCount = 0;

                if (supabaseAdmin && userData.id) {
                    const { count } = await supabaseAdmin
                        .from('pets')
                        .select('id', { count: 'exact', head: true })
                        .eq('owner_id', userData.id);
                    petCount = count || 0;
                }

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
                    'birth-date': userData.birth_date || member.customFields['birth-date'],
                    'first-name': userData.first_name || member.customFields['first-name'],
                    'paternal-last-name': userData.last_name || member.customFields['paternal-last-name'],
                    'maternal-last-name': userData.mother_last_name || member.customFields['maternal-last-name'],
                };

                const plan = member.planConnections?.[0];
                const paymentStatus = plan?.status?.toLowerCase() || 'none';
                const hasActivePlan = paymentStatus === 'active' || paymentStatus === 'trialing';
                const hasBasicPetFields = Boolean(
                    member.customFields['pet-1-name'] ||
                    member.customFields['pet-name'] ||
                    Number(member.customFields['total-pets'] || 0) > 0
                );

                (member as any).petCount = petCount;
                (member as any).registrationIssue = getRegistrationIssue({
                    hasActivePlan,
                    petCount,
                    hasValidPetBasic: hasBasicPetFields,
                });

                console.log(`✅ Datos de Supabase combinados para ${memberId}`);
            }
        } catch (supabaseError) {
            console.warn(`⚠️ Error al obtener datos de Supabase para ${memberId}:`, supabaseError);
        }

        return NextResponse.json({ success: true, member });

    } catch (error: any) {
        console.error('Error obteniendo detalles de miembro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// =========================================================================
// PATCH — Editar datos de usuario (todos los campos)
// =========================================================================
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser) return unauthorizedResponse();

        const { id: memberId } = await params;
        const body = await request.json();

        // Campos editables del usuario
        const {
            email,
            firstName,
            paternalLastName,
            maternalLastName,
            phone,
            birthDate,
            curp,
            address,
            colony,
            city,
            state,
            postalCode,
            // Metadata para logging
            memberName,
            changes,         // { fieldKey: { old, new } } — enviado desde el frontend
        } = body;

        const adminId = adminUser.memberstack_id;
        const adminName = adminUser.full_name || adminUser.email || 'Admin';

        console.log(`🔄 Admin ${adminName} editando datos del miembro ${memberId}`);

        // ── 1. Actualizar en Memberstack (solo campos que existen allá) ──────────
        const msFields: Record<string, any> = {};
        if (email !== undefined)           { /* email va aparte */ }
        if (firstName !== undefined)       msFields['first-name']         = firstName;
        if (paternalLastName !== undefined) msFields['paternal-last-name'] = paternalLastName;
        if (maternalLastName !== undefined) msFields['maternal-last-name'] = maternalLastName;
        if (phone !== undefined)            msFields['phone']               = phone;

        const msUpdatePayload: Record<string, any> = {};
        if (email !== undefined) {
            msUpdatePayload.email    = email;
            msUpdatePayload.verified = true;
        }
        if (Object.keys(msFields).length > 0) {
            msUpdatePayload.customFields = msFields;
        }

        if (Object.keys(msUpdatePayload).length > 0) {
            const msResult = await updateMemberData(memberId, msUpdatePayload);
            if (!msResult.success) {
                return NextResponse.json(
                    { error: `Error en Memberstack: ${msResult.error}` },
                    { status: 500 }
                );
            }
        }

        // ── 2. Actualizar en Supabase ─────────────────────────────────────────────
        const supabaseFields: Record<string, any> = {};
        if (email !== undefined)        supabaseFields.email        = email;
        if (firstName !== undefined)    supabaseFields.first_name   = firstName;
        if (paternalLastName !== undefined) supabaseFields.last_name = paternalLastName;
        if (maternalLastName !== undefined) supabaseFields.mother_last_name = maternalLastName;
        if (phone !== undefined)        supabaseFields.phone        = phone;
        if (birthDate !== undefined)    supabaseFields.birth_date   = birthDate;
        if (curp !== undefined)         supabaseFields.curp         = curp?.trim()?.toUpperCase() || curp;
        if (address !== undefined)      supabaseFields.address      = address;
        if (colony !== undefined)       supabaseFields.colony       = colony;
        if (city !== undefined)         supabaseFields.city         = city;
        if (state !== undefined)        supabaseFields.state        = state;
        if (postalCode !== undefined)   supabaseFields.postal_code  = postalCode;

        if (Object.keys(supabaseFields).length > 0) {
            const { error: supaErr } = await supabaseAdmin
                .from('users')
                .update(supabaseFields)
                .eq('memberstack_id', memberId);

            if (supaErr) {
                console.error('⚠️ Error actualizando usuario en Supabase:', supaErr.message);
            }
        }

        // ── 3. Registrar edición en member_edits ──────────────────────────────────
        const { error: editLogErr } = await supabaseAdmin
            .from('member_edits')
            .insert({
                member_id: memberId,
                member_name: memberName || memberId,
                pet_id: null,
                pet_name: null,
                edited_by_id: adminId || 'admin',
                edited_by_name: adminName,
                changes: changes || supabaseFields,
                edit_type: 'user_data',
                created_at: new Date().toISOString(),
            });

        if (editLogErr) {
            console.warn('⚠️ No se pudo registrar el log de edición (tabla member_edits puede no existir):', editLogErr.message);
        }

        // ── 4. Registrar en appeal_logs (chat visible del admin en el modal) ──────
        const changedFieldsList = Object.keys(changes || supabaseFields);
        if (changedFieldsList.length > 0) {
            const fieldLabels: Record<string, string> = {
                email: 'Correo', first_name: 'Nombre', last_name: 'Apellido Paterno',
                mother_last_name: 'Apellido Materno', phone: 'Teléfono',
                birth_date: 'Fecha de Nacimiento', curp: 'CURP',
                address: 'Dirección', colony: 'Colonia', city: 'Ciudad',
                state: 'Estado', postal_code: 'Código Postal',
            };
            const changedLabels = changedFieldsList.map(k => fieldLabels[k] || k).join(', ');

            await supabaseAdmin.from('appeal_logs').insert({
                user_id: memberId,
                pet_id: null,
                admin_id: adminId || 'admin',
                type: 'admin_edit',
                message: `✏️ ${adminName} actualizó datos del usuario. Campos modificados: ${changedLabels}.`,
                metadata: { edit_type: 'user_data', changes: changes || supabaseFields },
                created_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Datos del usuario actualizados correctamente',
        });

    } catch (error: any) {
        console.error('Error actualizando miembro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
