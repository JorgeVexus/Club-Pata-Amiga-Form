/**
 * Servicio para consultar códigos postales de México usando API gratuita
 * API: api-sepomex.hckdrk.mx (gratuita y sin necesidad de autenticación)
 */

import type { PostalCodeResponse, AddressData, Colony } from '@/types/form.types';

const POSTAL_CODE_API_URL = 'https://api-sepomex.hckdrk.mx/query/';

// Cache simple para evitar llamadas repetidas
const cache = new Map<string, AddressData>();

/**
 * Consulta información de dirección basada en código postal
 * @param postalCode - Código postal de 5 dígitos
 * @returns Datos de dirección (estado, ciudad, colonias)
 */
export async function getAddressByPostalCode(postalCode: string): Promise<AddressData | null> {
    // Validar formato de código postal (5 dígitos)
    if (!/^\d{5}$/.test(postalCode)) {
        throw new Error('El código postal debe tener 5 dígitos');
    }

    // Verificar cache
    if (cache.has(postalCode)) {
        return cache.get(postalCode)!;
    }

    try {
        const response = await fetch(`${POSTAL_CODE_API_URL}info_cp/${postalCode}?type=simplified`);

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Código postal no encontrado
            }
            throw new Error('Error al consultar el código postal');
        }

        const data: PostalCodeResponse = await response.json();

        // Verificar si hay error en la respuesta
        if (data.error || !data.response || data.response.length === 0) {
            return null;
        }

        // Extraer datos únicos
        const firstResult = data.response[0];
        const state = firstResult.estado;
        const city = firstResult.ciudad || firstResult.municipio;

        // Extraer todas las colonias únicas
        const colonies: Colony[] = data.response.map(item => ({
            name: item.asentamiento,
            type: item.tipo_asentamiento,
        }));

        // Remover duplicados
        const uniqueColonies = colonies.filter((colony, index, self) =>
            index === self.findIndex(c => c.name === colony.name)
        );

        const addressData: AddressData = {
            state,
            city,
            colonies: uniqueColonies,
        };

        // Guardar en cache
        cache.set(postalCode, addressData);

        return addressData;
    } catch (error) {
        console.error('Error fetching postal code data:', error);
        throw error;
    }
}

/**
 * Limpia el cache (útil para testing o cuando se necesite forzar actualización)
 */
export function clearPostalCodeCache(): void {
    cache.clear();
}
