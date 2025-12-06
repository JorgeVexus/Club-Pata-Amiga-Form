/**
 * Utilidades para validación de edad
 */

/**
 * Calcula la edad de una persona basándose en su fecha de nacimiento
 * @param birthDate - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns Edad en años
 */
export function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Si aún no ha cumplido años este año, restar 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Valida si una persona es mayor de edad (18 años o más)
 * @param birthDate - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns true si es mayor de edad
 */
export function isAdult(birthDate: string): boolean {
    return calculateAge(birthDate) >= 18;
}

/**
 * Calcula la fecha máxima permitida para ser mayor de edad
 * (18 años atrás desde hoy)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getMaxBirthDateForAdult(): string {
    const today = new Date();
    const maxDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    );

    return maxDate.toISOString().split('T')[0];
}

/**
 * Calcula la fecha mínima razonable de nacimiento
 * (120 años atrás desde hoy - edad máxima razonable)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getMinBirthDate(): string {
    const today = new Date();
    const minDate = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate()
    );

    return minDate.toISOString().split('T')[0];
}

/**
 * Valida una fecha de nacimiento
 * @param birthDate - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns Objeto con resultado de validación y mensaje
 */
export function validateBirthDate(birthDate: string): {
    isValid: boolean;
    error?: string;
    age?: number;
} {
    if (!birthDate) {
        return {
            isValid: false,
            error: 'La fecha de nacimiento es requerida',
        };
    }

    const age = calculateAge(birthDate);

    // Validar que no sea una fecha futura
    if (age < 0) {
        return {
            isValid: false,
            error: 'La fecha de nacimiento no puede ser en el futuro',
        };
    }

    // Validar edad mínima (18 años)
    if (age < 18) {
        return {
            isValid: false,
            error: `Debes ser mayor de edad para registrarte. Actualmente tienes ${age} años.`,
            age,
        };
    }

    // Validar edad máxima razonable (120 años)
    if (age > 120) {
        return {
            isValid: false,
            error: 'Por favor verifica la fecha de nacimiento ingresada',
        };
    }

    return {
        isValid: true,
        age,
    };
}

/**
 * Formatea una edad en un mensaje legible
 * @param age - Edad en años
 * @returns Mensaje formateado
 */
export function formatAgeMessage(age: number): string {
    if (age === 1) return '1 año';
    return `${age} años`;
}
