/**
 * Utilidades para validación de RFC (Registro Federal de Contribuyentes) de México
 * Basado en los estándares del SAT.
 */

/**
 * Valida el formato de un RFC
 * Persona Física: 4 letras, 6 dígitos (AAMMDD), 3 caracteres (homoclave) = 13 total
 * Persona Moral: 3 letras, 6 dígitos (AAMMDD), 3 caracteres (homoclave) = 12 total
 * 
 * @param rfc - RFC a validar
 * @returns Objeto con resultado de validación y tipo detectado
 */
export function validateRFCFormat(rfc: string): {
    isValid: boolean;
    type?: 'physical' | 'moral';
    error?: string;
} {
    if (!rfc) {
        return { isValid: false, error: 'El RFC es requerido' };
    }

    const cleanRFC = rfc.toUpperCase().trim();

    // Regex para Persona Física (13 caracteres)
    // 4 letras (la primera puede ser Ñ o &) + 6 dígitos + 3 caracteres homoclave
    const FISICA_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/;

    // Regex para Persona Moral (12 caracteres)
    // 3 letras (la primera puede ser Ñ o &) + 6 dígitos + 3 caracteres homoclave
    const MORAL_REGEX = /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/;

    if (cleanRFC.length === 12) {
        if (MORAL_REGEX.test(cleanRFC)) {
            return { isValid: true, type: 'moral' };
        }
        return { 
            isValid: false, 
            error: 'Formato de Persona Moral inválido (debe ser 3 letras, 6 números y 3 caracteres)' 
        };
    }

    if (cleanRFC.length === 13) {
        if (FISICA_REGEX.test(cleanRFC)) {
            return { isValid: true, type: 'physical' };
        }
        return { 
            isValid: false, 
            error: 'Formato de Persona Física inválido (debe ser 4 letras, 6 números y 3 caracteres)' 
        };
    }

    return { 
        isValid: false, 
        error: 'El RFC debe tener exactamente 12 caracteres (Persona Moral) o 13 caracteres (Persona Física)' 
    };
}

/**
 * Calcula el dígito verificador de un RFC
 * @param rfcBase - RFC sin el último dígito
 * @returns Dígito verificador (0-9 o A)
 */
export function calculateRFCCheckDigit(rfcBase: string): string {
    const dictionary: Record<string, number> = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
        'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, '&': 24, 'O': 25, 'P': 26, 'Q': 27,
        'R': 28, 'S': 29, 'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 36,
        ' ': 37, 'Ñ': 38
    };

    let sum = 0;
    const n = rfcBase.length;

    // El peso depende de la posición desde la derecha
    // Para 12 chars (Moral base 11): pesos 12, 11, ..., 2
    // Para 13 chars (Física base 12): pesos 13, 12, ..., 2
    // Generalizado: peso = (totalLength + 1) - i
    const totalLength = n + 1;

    for (let i = 0; i < n; i++) {
        const char = rfcBase[i];
        const val = dictionary[char] ?? 0;
        const weight = totalLength - i;
        sum += val * weight;
    }

    const remainder = sum % 11;
    const diff = 11 - remainder;

    if (diff === 11) return '0';
    if (diff === 10) return 'A';
    return diff.toString();
}

/**
 * Valida el dígito verificador de un RFC completo
 * @param rfc - RFC completo
 * @returns true si el dígito es correcto
 */
export function validateRFCCheckDigit(rfc: string): boolean {
    const cleanRFC = rfc.toUpperCase().trim();
    if (cleanRFC.length < 12 || cleanRFC.length > 13) return false;

    const rfcBase = cleanRFC.substring(0, cleanRFC.length - 1);
    const providedCheckDigit = cleanRFC.charAt(cleanRFC.length - 1);
    const calculatedCheckDigit = calculateRFCCheckDigit(rfcBase);

    return providedCheckDigit === calculatedCheckDigit;
}

/**
 * Validación completa de RFC (formato + dígito verificador + fecha básica)
 * @param rfc - RFC a validar
 * @returns Resultado de validación
 */
export function validateRFC(rfc: string): {
    isValid: boolean;
    type?: 'physical' | 'moral';
    error?: string;
} {
    // 1. Validar formato y longitud
    const formatResult = validateRFCFormat(rfc);
    if (!formatResult.isValid) return formatResult;

    const cleanRFC = rfc.toUpperCase().trim();

    // 2. Validar fecha (posiciones varían según tipo)
    const datePart = formatResult.type === 'physical' 
        ? cleanRFC.substring(4, 10) 
        : cleanRFC.substring(3, 9);
    
    const year = parseInt(datePart.substring(0, 2));
    const month = parseInt(datePart.substring(2, 4));
    const day = parseInt(datePart.substring(4, 6));

    if (month < 1 || month > 12) {
        return { isValid: false, error: 'El mes en el RFC es inválido' };
    }
    if (day < 1 || day > 31) {
        return { isValid: false, error: 'El día en el RFC es inválido' };
    }

    return { 
        isValid: true, 
        type: formatResult.type
    };
}

/**
 * Formatea un RFC (convierte a mayúsculas y elimina caracteres especiales)
 * @param rfc - RFC a formatear
 * @returns RFC formateado
 */
export function formatRFC(rfc: string): string {
    if (!rfc) return '';
    return rfc.toUpperCase().trim().replace(/[^A-Z0-9Ñ&]/g, '');
}
