/**
 * Utilidades para manejo de códigos postales en México
 */

/**
 * Mapeo de rangos de códigos postales de la CDMX a sus respectivas Alcaldías.
 * Fuente: Datos proporcionados basados en rangos oficiales.
 */
const CDMX_RANGES = [
    { min: 1000, max: 1999, name: "Álvaro Obregón" },
    { min: 2000, max: 2999, name: "Azcapotzalco" },
    { min: 3000, max: 3999, name: "Benito Juárez" },
    { min: 4000, max: 4999, name: "Coyoacán" },
    { min: 5000, max: 5999, name: "Cuajimalpa de Morelos" },
    { min: 6000, max: 6999, name: "Cuauhtémoc" },
    { min: 7000, max: 7999, name: "Gustavo A. Madero" },
    { min: 8000, max: 8999, name: "Iztacalco" },
    { min: 9000, max: 9999, name: "Iztapalapa" },
    { min: 10000, max: 10999, name: "Magdalena Contreras" },
    { min: 11000, max: 11999, name: "Miguel Hidalgo" },
    { min: 12000, max: 12999, name: "Milpa Alta" },
    { min: 13000, max: 13999, name: "Tláhuac" },
    { min: 14000, max: 14999, name: "Tlalpan" },
    { min: 15000, max: 15999, name: "Venustiano Carranza" },
    { min: 16000, max: 16999, name: "Xochimilco" }
];

/**
 * Obtiene la Alcaldía de la CDMX asociada a un código postal.
 * @param cp Código postal de 5 dígitos
 * @returns Nombre de la alcaldía o null si no pertenece a CDMX
 */
export const getCDMXAlcaldia = (cp: string | number): string | null => {
    const code = typeof cp === 'string' ? parseInt(cp, 10) : cp;
    if (isNaN(code)) return null;

    const range = CDMX_RANGES.find(r => code >= r.min && code <= r.max);
    return range ? range.name : null;
};

/**
 * Determina si un estado es Ciudad de México
 */
export const isCDMXState = (stateName: string): boolean => {
    const lower = stateName.toLowerCase();
    return lower.includes('ciudad de méxico') || 
           lower.includes('mexico city') || 
           lower.includes('distrito federal') || 
           lower.includes('cdmx');
};
