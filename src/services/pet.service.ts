/**
 * Servicio para cálculo de períodos de carencia de mascotas
 * y gestión de datos de mascotas en Memberstack
 */

import type {
    PetFormData,
    WaitingPeriodCalculation,
    PetServiceResponse
} from '@/types/pet.types';

/**
 * Calcula el período de carencia para una mascota
 * @param isOriginal - ¿Es una de las primeras 3 mascotas?
 * @param isAdopted - ¿Fue adoptada o rescatada?
 * @param isMixed - ¿Es mestiza/criolla?
 * @returns Información del período de carencia
 */
export function calculateWaitingPeriod(
    isOriginal: boolean,
    isAdopted: boolean,
    isMixed: boolean = false,
    hasReferralCode: boolean = false
): WaitingPeriodCalculation {
    // Mascotas de reemplazo siempre tienen 6 meses (180 días)
    if (!isOriginal) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 180);

        return {
            days: 180,
            months: 6,
            endDate: endDate.toISOString(),
            hasReduction: false,
        };
    }

    if (isAdopted || hasReferralCode) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);

        const reductionReason = hasReferralCode ? 'referral' : 'adopted';

        return {
            days: 90,
            months: 3,
            endDate: endDate.toISOString(),
            hasReduction: true,
            reductionReason,
        };
    }

    // Caso estándar: 180 días (6 meses)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 180);

    return {
        days: 180,
        months: 6,
        endDate: endDate.toISOString(),
        hasReduction: false,
    };
}

/**
 * Guarda los datos de las mascotas en Memberstack
 * @param pets - Array de mascotas (máximo 3)
 * @param ambassadorCode - Código de embajador (opcional)
 * @returns Respuesta del servicio
 */
export async function savePetsToMemberstack(
    pets: PetFormData[],
    ambassadorCode: string = ''
): Promise<PetServiceResponse> {
    try {
        // Verificar que Memberstack esté cargado
        if (!window.$memberstackDom) {
            return {
                success: false,
                error: 'Memberstack no está cargado',
            };
        }

        // Obtener miembro actual
        const currentMember = await window.$memberstackDom.getCurrentMember();
        if (!currentMember) {
            return {
                success: false,
                error: 'No hay usuario autenticado',
            };
        }

        // Preparar custom fields
        const customFields: Record<string, string> = {
            'total-pets': pets.length.toString(),
            'ambassador-code': ambassadorCode,
        };

        // Agregar datos de cada mascota
        pets.forEach((pet, index) => {
            const petNum = index + 1;
            const prefix = `pet-${petNum}`;

            // Validar y asignar con valores por defecto
            customFields[`${prefix}-name`] = pet.name || '';
            customFields[`${prefix}-last-name`] = pet.lastName || '';
            customFields[`${prefix}-type`] = pet.petType || '';
            // Nota: gender se guarda solo en Supabase, no en Memberstack
            customFields[`${prefix}-is-mixed`] = (pet.isMixed ?? false).toString();
            customFields[`${prefix}-breed`] = pet.breed || '';
            customFields[`${prefix}-breed-size`] = pet.breedSize || '';
            customFields[`${prefix}-age`] = pet.age || '';
            customFields[`${prefix}-exceeds-max-age`] = (pet.exceedsMaxAge ?? false).toString();
            customFields[`${prefix}-is-adopted`] = (pet.isAdopted ?? false).toString();
            customFields[`${prefix}-adoption-story`] = pet.adoptionStory || '';
            customFields[`${prefix}-is-original`] = (pet.isOriginal ?? true).toString();
            customFields[`${prefix}-waiting-period-days`] = (pet.waitingPeriodDays ?? 180).toString();
            customFields[`${prefix}-waiting-period-end`] = pet.waitingPeriodEnd || '';
            customFields[`${prefix}-registration-date`] = pet.registrationDate || new Date().toISOString();
            customFields[`${prefix}-is-active`] = (pet.isActive ?? true).toString();
            customFields[`${prefix}-replaced-date`] = pet.replacedDate || '';

            // URLs de fotos y certificado (se agregan después de subir a Supabase)
            customFields[`${prefix}-photo-1-url`] = '';
            customFields[`${prefix}-photo-2-url`] = '';
            customFields[`${prefix}-vet-certificate-url`] = '';
        });

        // Actualizar Memberstack usando updateMember
        console.log('Custom fields a guardar:', customFields);

        try {
            const updateResponse = await window.$memberstackDom.updateMember({
                customFields: customFields,
            });

            console.log('✅ Datos guardados exitosamente en Memberstack:', updateResponse);
        } catch (updateError: any) {
            console.error('Error al actualizar Memberstack:', updateError);
            throw new Error(`Error al actualizar datos: ${updateError.message || updateError}`);
        }

        // Si hay código de embajador, registrar el referido
        if (ambassadorCode && ambassadorCode.trim()) {
            try {
                console.log('🐾 Registrando referido con código:', ambassadorCode);

                const memberEmail = currentMember.data?.auth?.email;
                const memberName = currentMember.data?.customFields?.['first-name'] || '';
                const memberLastName = currentMember.data?.customFields?.['paternal-last-name'] || '';

                const referralResponse = await fetch(`${getApiBaseUrl()}/api/referrals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        referral_code: ambassadorCode.trim().toUpperCase(),
                        referred_user_id: currentMember.data.id,
                        referred_user_name: `${memberName} ${memberLastName}`.trim() || 'Usuario',
                        referred_user_email: memberEmail || '',
                        membership_plan: 'pending', // Se actualizará cuando pague
                        membership_amount: 0, // Se actualizará cuando pague
                    }),
                });

                const referralData = await referralResponse.json();

                if (referralData.success) {
                    console.log('✅ Referido registrado exitosamente');
                } else {
                    console.warn('⚠️ No se pudo registrar el referido:', referralData.error);
                }
            } catch (referralError) {
                console.error('Error registrando referido (no crítico):', referralError);
                // No fallar el registro de mascotas si falla el referido
            }
        }

        return {
            success: true,
            petIds: pets.map((_, i) => `pet-${i + 1}`),
        };
    } catch (error: any) {
        console.error('Error guardando mascotas:', error);
        return {
            success: false,
            error: error.message || 'Error al guardar las mascotas',
        };
    }
}

// Helper para obtener la URL base de la API
function getApiBaseUrl(): string {
    // En producción usa la URL de Vercel, en desarrollo usa localhost
    if (typeof window !== 'undefined') {
        const host = window.location.host;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return 'http://localhost:3000';
        }
    }
    return 'https://app.pataamiga.mx';
}

/**
 * Actualiza las URLs de las fotos de una mascota en Memberstack
 * @param petIndex - Índice de la mascota (0-2)
 * @param photoUrls - Array de URLs de fotos
 */
export async function updatePetPhotos(
    petIndex: number,
    photoUrls: string[]
): Promise<boolean> {
    try {
        if (!window.$memberstackDom) return false;

        const petNum = petIndex + 1;
        const customFields: Record<string, string> = {
            [`pet-${petNum}-photo-1-url`]: photoUrls[0] || '',
            [`pet-${petNum}-photo-2-url`]: photoUrls[1] || '',
        };

        await window.$memberstackDom.updateMember({ customFields });
        return true;
    } catch (error) {
        console.error('Error actualizando fotos:', error);
        return false;
    }
}

/**
 * Formatea el mensaje de período de carencia para mostrar al usuario
 */
export function formatWaitingPeriodMessage(
    calculation: WaitingPeriodCalculation
): string {
    if (calculation.hasReduction) {
        let reason = '';
        
        switch (calculation.reductionReason) {
            case 'adopted':
                reason = 'fue adoptada';
                break;
            case 'referral':
                reason = 'usó un código de Embajador';
                break;
            default:
                reason = 'cumple con criterios de reducción';
        }

        return `✅ Como tu mascota ${reason}, su período de carencia se reduce a ${calculation.months} meses.`;
    }

    return `Período de carencia estándar: ${calculation.months} meses.`;
}
