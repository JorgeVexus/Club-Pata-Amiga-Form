/**
 * Utilidades para validación de CURP (Clave Única de Registro de Población)
 * Formato: AAAA######HHHHHH##
 * Ejemplo: PEGJ900101HDFRNN09
 */

/**
 * Valida el formato de una CURP mexicana
 * @param curp - CURP a validar
 * @returns true si el formato es válido
 */
export function validateCURPFormat(curp: string): boolean {
    if (!curp) return false;

    // Convertir a mayúsculas y eliminar espacios
    const cleanCURP = curp.toUpperCase().trim();

    // Verificar longitud
    if (cleanCURP.length !== 18) return false;

    // Expresión regular para validar formato CURP
    // Formato: 4 letras + 6 dígitos + 1 letra + 5 letras/dígitos + 2 dígitos
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

    if (!curpRegex.test(cleanCURP)) return false;

    // Validar que las primeras 4 letras no sean palabras altisonantes
    const forbiddenWords = [
        'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO',
        'COGE', 'COGI', 'COJA', 'COJE', 'COJI', 'COJO', 'COLA', 'CULO',
        'FALO', 'FETO', 'GETA', 'GUEI', 'GUEY', 'JETA', 'JOTO', 'KACA',
        'KACO', 'KAGA', 'KAGO', 'KAKA', 'KAKO', 'KOGE', 'KOGI', 'KOJA',
        'KOJE', 'KOJI', 'KOJO', 'KOLA', 'KULO', 'LILO', 'LOCA', 'LOCO',
        'LOKA', 'LOKO', 'MAME', 'MAMO', 'MEAR', 'MEAS', 'MEON', 'MIAR',
        'MION', 'MOCO', 'MOKO', 'MULA', 'MULO', 'NACA', 'NACO', 'PEDA',
        'PEDO', 'PENE', 'PIPI', 'PITO', 'POPO', 'PUTA', 'PUTO', 'QULO',
        'RATA', 'ROBA', 'ROBE', 'ROBO', 'RUIN', 'SENO', 'TETA', 'VACA',
        'VAGA', 'VAGO', 'VAKA', 'VUEI', 'VUEY', 'WUEI', 'WUEY'
    ];

    const firstFour = cleanCURP.substring(0, 4);
    if (forbiddenWords.includes(firstFour)) return false;

    // Validar fecha de nacimiento (posiciones 4-9: AAMMDD)
    const year = parseInt(cleanCURP.substring(4, 6));
    const month = parseInt(cleanCURP.substring(6, 8));
    const day = parseInt(cleanCURP.substring(8, 10));

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Validar sexo (posición 10: H o M)
    const gender = cleanCURP.charAt(10);
    if (gender !== 'H' && gender !== 'M') return false;

    // Validar estado (posiciones 11-12)
    const validStates = [
        'AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG',
        'GT', 'GR', 'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC',
        'PL', 'QT', 'QR', 'SP', 'SL', 'SR', 'TC', 'TS', 'TL', 'VZ',
        'YN', 'ZS', 'NE' // NE = Nacido en el Extranjero
    ];

    const state = cleanCURP.substring(11, 13);
    if (!validStates.includes(state)) return false;

    return true;
}

/**
 * Calcula el dígito verificador de una CURP
 * @param curp - CURP sin dígito verificador (17 caracteres)
 * @returns Dígito verificador
 */
export function calculateCURPCheckDigit(curp: string): string {
    const dictionary = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    let sum = 0;

    for (let i = 0; i < 17; i++) {
        const char = curp.charAt(i);
        const value = dictionary.indexOf(char);
        sum += value * (18 - i);
    }

    const remainder = sum % 10;
    const checkDigit = (10 - remainder) % 10;

    return checkDigit.toString();
}

/**
 * Valida el dígito verificador de una CURP completa
 * @param curp - CURP completa (18 caracteres)
 * @returns true si el dígito verificador es correcto
 */
export function validateCURPCheckDigit(curp: string): boolean {
    if (curp.length !== 18) return false;

    const curpWithoutCheck = curp.substring(0, 17);
    const providedCheckDigit = curp.charAt(17);
    const calculatedCheckDigit = calculateCURPCheckDigit(curpWithoutCheck);

    return providedCheckDigit === calculatedCheckDigit;
}

/**
 * Validación completa de CURP (formato + dígito verificador)
 * @param curp - CURP a validar
 * @returns Objeto con resultado de validación y mensaje
 */
export function validateCURP(curp: string): {
    isValid: boolean;
    error?: string;
} {
    // Validar formato básico
    if (!validateCURPFormat(curp)) {
        return {
            isValid: false,
            error: 'El formato de la CURP no es válido. Debe tener 18 caracteres y seguir el formato oficial.',
        };
    }

    // Validar dígito verificador
    if (!validateCURPCheckDigit(curp)) {
        return {
            isValid: false,
            error: 'El dígito verificador de la CURP no es correcto. Verifica que esté escrita correctamente.',
        };
    }

    return { isValid: true };
}

/**
 * Formatea una CURP (convierte a mayúsculas y elimina espacios)
 * @param curp - CURP a formatear
 * @returns CURP formateada
 */
export function formatCURP(curp: string): string {
    return curp.toUpperCase().trim().replace(/\s/g, '');
}

/**
 * Extrae información de una CURP válida
 * @param curp - CURP válida
 * @returns Información extraída
 */
export function extractCURPInfo(curp: string): {
    birthDate: string;
    gender: 'Hombre' | 'Mujer';
    state: string;
} | null {
    if (!validateCURPFormat(curp)) return null;

    const cleanCURP = formatCURP(curp);

    // Extraer fecha de nacimiento
    const year = parseInt(cleanCURP.substring(4, 6));
    const month = cleanCURP.substring(6, 8);
    const day = cleanCURP.substring(8, 10);
    const fullYear = year >= 0 && year <= 30 ? 2000 + year : 1900 + year;
    const birthDate = `${fullYear}-${month}-${day}`;

    // Extraer género
    const genderCode = cleanCURP.charAt(10);
    const gender = genderCode === 'H' ? 'Hombre' : 'Mujer';

    // Extraer estado
    const stateCode = cleanCURP.substring(11, 13);
    const stateNames: Record<string, string> = {
        'AS': 'Aguascalientes',
        'BC': 'Baja California',
        'BS': 'Baja California Sur',
        'CC': 'Campeche',
        'CL': 'Coahuila',
        'CM': 'Colima',
        'CS': 'Chiapas',
        'CH': 'Chihuahua',
        'DF': 'Ciudad de México',
        'DG': 'Durango',
        'GT': 'Guanajuato',
        'GR': 'Guerrero',
        'HG': 'Hidalgo',
        'JC': 'Jalisco',
        'MC': 'México',
        'MN': 'Michoacán',
        'MS': 'Morelos',
        'NT': 'Nayarit',
        'NL': 'Nuevo León',
        'OC': 'Oaxaca',
        'PL': 'Puebla',
        'QT': 'Querétaro',
        'QR': 'Quintana Roo',
        'SP': 'San Luis Potosí',
        'SL': 'Sinaloa',
        'SR': 'Sonora',
        'TC': 'Tabasco',
        'TS': 'Tamaulipas',
        'TL': 'Tlaxcala',
        'VZ': 'Veracruz',
        'YN': 'Yucatán',
        'ZS': 'Zacatecas',
        'NE': 'Nacido en el Extranjero',
    };

    return {
        birthDate,
        gender,
        state: stateNames[stateCode] || stateCode,
    };
}
