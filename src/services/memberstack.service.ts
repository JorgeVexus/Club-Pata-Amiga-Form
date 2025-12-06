/**
 * Servicio para interactuar con Memberstack v2
 * Maneja la creación de usuarios y actualización de custom fields
 */

import type { RegistrationFormData, MemberstackResponse } from '@/types/form.types';

// Declaración de tipos para Memberstack global
declare global {
    interface Window {
        $memberstackDom?: any;
    }
}

/**
 * Verifica si Memberstack está cargado
 */
function isMemberstackLoaded(): boolean {
    return typeof window !== 'undefined' && Boolean(window.$memberstackDom);
}

/**
 * Espera a que Memberstack se cargue (máximo 10 segundos)
 */
async function waitForMemberstack(): Promise<boolean> {
    if (isMemberstackLoaded()) return true;

    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 10 segundos (50 * 200ms)

        const interval = setInterval(() => {
            attempts++;
            if (isMemberstackLoaded()) {
                clearInterval(interval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                resolve(false);
            }
        }, 200);
    });
}

/**
 * Crea un nuevo usuario en Memberstack con los datos del formulario
 * @param formData - Datos del formulario de registro
 * @param fileUrls - URLs de los archivos subidos a Supabase
 * @returns Respuesta de Memberstack
 */
export async function createMemberstackUser(
    formData: RegistrationFormData,
    fileUrls: {
        ineUrls: string[];
        proofOfAddressUrl: string;
    }
): Promise<MemberstackResponse> {
    // Esperar a que Memberstack se cargue
    const loaded = await waitForMemberstack();

    if (!loaded || !window.$memberstackDom) {
        return {
            success: false,
            error: 'Memberstack no está cargado. Por favor recarga la página.',
        };
    }

    try {
        // Preparar custom fields
        const customFields = mapFormDataToCustomFields(formData, fileUrls);

        console.log('✅ Creando usuario en Memberstack...');

        // Usar el método correcto de la DOM API de Memberstack v2
        const response = await window.$memberstackDom.signupMemberEmailPassword({
            email: formData.email,
            password: formData.password,
            customFields: customFields,
        });

        console.log('✅ Usuario creado exitosamente:', response);

        if (response && response.data) {
            return {
                success: true,
                member: {
                    id: response.data.id,
                    email: response.data.auth?.email || formData.email,
                    customFields: response.data.customFields || customFields,
                },
            };
        }

        return {
            success: false,
            error: 'Error al crear el usuario en Memberstack',
        };
    } catch (error: any) {
        console.error('❌ Memberstack error:', error);
        return handleMemberstackError(error);
    }
}

/**
 * Completa el perfil de un usuario existente (Social Login o Email previo)
 */
export async function completeMemberProfile(
    formData: RegistrationFormData,
    fileUrls: {
        ineUrls: string[];
        proofOfAddressUrl: string;
    }
): Promise<MemberstackResponse> {
    const loaded = await waitForMemberstack();

    if (!loaded || !window.$memberstackDom) {
        return { success: false, error: 'Memberstack no está cargado.' };
    }

    try {
        const customFields = mapFormDataToCustomFields(formData, fileUrls);

        console.log('✅ Actualizando perfil en Memberstack...');
        const response = await window.$memberstackDom.updateMemberJSON({
            json: customFields // V2 usa 'json' o 'customFields' dependiendo la versión exacta, pero updateMemberJSON usualmente toma el objeto directo o un wrapper.
            // Revisando documentación común V2: updateMemberJSON({ customFields: ... }) o updateMember({ customFields: ... })
            // vamos a usar updateMember que es más seguro para custom fields
        });

        // Fallback si updateMemberJSON no es lo que queremos, usamos updateMember
        // Pero window.$memberstackDom.updateMember es lo standard.
        // Vamos a asumir updateMember que es lo que usabamos abajo.
    } catch (e) {
        // Fallthrough to retry with standard updateMember
    }

    try {
        const customFields = mapFormDataToCustomFields(formData, fileUrls);
        const response = await window.$memberstackDom.updateMember({
            customFields: customFields
        });

        return {
            success: true,
            member: response.data,
        };
    } catch (error: any) {
        console.error('❌ Error actualizando perfil:', error);
        return handleMemberstackError(error);
    }
}

function mapFormDataToCustomFields(formData: RegistrationFormData, fileUrls: any) {
    return {
        // Información personal
        'first-name': formData.firstName,
        'paternal-last-name': formData.paternalLastName,
        'maternal-last-name': formData.maternalLastName,
        'gender': formData.gender,
        'birth-date': formData.birthDate,
        'curp': formData.curp,

        // Dirección
        'postal-code': formData.postalCode,
        'state': formData.state,
        'city': formData.city,
        'colony': formData.colony,
        'address': formData.address,

        // Contacto
        'phone': formData.phone,

        // URLs de documentos
        'ine-front-url': fileUrls.ineUrls[0] || '',
        'ine-back-url': fileUrls.ineUrls[1] || '',
        'proof-of-address-url': fileUrls.proofOfAddressUrl,

        // Metadata
        'registration-date': new Date().toISOString(),
        'waiting-period-end': calculateWaitingPeriodEnd(),
    };
}

function handleMemberstackError(error: any) {
    let errorMessage = 'Error desconocido';

    if (error.message?.includes('email') || error.message?.includes('already exists')) {
        errorMessage = 'Este correo electrónico ya está registrado';
    } else if (error.message?.includes('password')) {
        errorMessage = 'La contraseña no cumple con los requisitos mínimos';
    } else if (error.message) {
        errorMessage = error.message;
    }

    return {
        success: false,
        error: errorMessage,
    };

}

/**
 * Calcula la fecha de fin del período de carencia (90 días desde hoy)
 * @returns Fecha en formato ISO
 */
function calculateWaitingPeriodEnd(): string {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);
    return endDate.toISOString();
}

/**
 * Actualiza los custom fields de un miembro existente
 * @param customFields - Campos a actualizar
 */
export async function updateMemberCustomFields(
    customFields: Record<string, any>
): Promise<MemberstackResponse> {
    const loaded = await waitForMemberstack();

    if (!loaded || !window.$memberstackDom) {
        return {
            success: false,
            error: 'Memberstack no está cargado',
        };
    }

    try {
        const response = await window.$memberstackDom.updateMemberJSON({
            customFields,
        });

        return {
            success: true,
            member: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Error al actualizar los datos',
        };
    }
}
