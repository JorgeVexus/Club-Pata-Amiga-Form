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
 * @param hasRUAC - ¿Tiene código RUAC?
 * @returns Información del período de carencia
 */
export function calculateWaitingPeriod(
    isOriginal: boolean,
    isAdopted: boolean,
    hasRUAC: boolean
): WaitingPeriodCalculation {
    // Mascotas de reemplazo siempre tienen 6 meses
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

    // Mascotas originales con beneficio: 4 meses
    if (isAdopted || hasRUAC) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 120);

        let reductionReason: 'adopted' | 'ruac' | 'both' = 'adopted';
        if (isAdopted && hasRUAC) reductionReason = 'both';
        else if (hasRUAC) reductionReason = 'ruac';

        return {
            days: 120,
            months: 4,
            endDate: endDate.toISOString(),
            hasReduction: true,
            reductionReason,
        };
    }

    // Caso estándar: 6 meses
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
            customFields[`${prefix}-is-mixed`] = (pet.isMixed ?? false).toString();
            customFields[`${prefix}-breed`] = pet.breed || '';
            customFields[`${prefix}-breed-size`] = pet.breedSize || '';
            customFields[`${prefix}-age`] = pet.age || '';
            customFields[`${prefix}-exceeds-max-age`] = (pet.exceedsMaxAge ?? false).toString();
            customFields[`${prefix}-is-adopted`] = (pet.isAdopted ?? false).toString();
            customFields[`${prefix}-adoption-story`] = pet.adoptionStory || '';
            customFields[`${prefix}-ruac`] = pet.ruac || '';
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
        const reason = calculation.reductionReason === 'both'
            ? 'fue adoptada y tiene RUAC'
            : calculation.reductionReason === 'adopted'
                ? 'fue adoptada'
                : 'tiene RUAC';

        return `✅ Como tu mascota ${reason}, su período de carencia se reduce a ${calculation.months} meses.`;
    }

    return `Período de carencia estándar: ${calculation.months} meses.`;
}
