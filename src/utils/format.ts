/**
 * Formatea un número como moneda MXN (Pesos Mexicanos)
 * @param amount El monto a formatear
 * @returns String formateado (ej. $1,699.00)
 */
export const formatMXN = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};
