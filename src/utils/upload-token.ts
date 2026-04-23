/**
 * Utilidades para generar y verificar tokens seguros de subida de documentos.
 *
 * Estos tokens se incluyen en los emails de seguimiento para permitir que
 * el usuario suba documentos sin necesidad de iniciar sesión (magic link).
 *
 * El token es un HMAC-SHA256 firmado con CRON_SECRET que incluye:
 * - memberId
 * - petIndex
 * - timestamp de expiración
 *
 * Expira en 30 días por defecto.
 */

import crypto from 'crypto';

const TOKEN_EXPIRY_DAYS = 30;

function getSecret(): string {
    return process.env.CRON_SECRET || 'fallback-secret-dev';
}

/**
 * Genera un token seguro para un enlace de subida de documentos.
 */
export function generateUploadToken(memberId: string, petIndex: number): { token: string; exp: number } {
    const exp = Math.floor(Date.now() / 1000) + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60);
    const payload = `${memberId}:${petIndex}:${exp}`;
    const token = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    return { token, exp };
}

/**
 * Verifica un token de subida. Devuelve true si es válido y no ha expirado.
 */
export function verifyUploadToken(memberId: string, petIndex: number, token: string, exp: number): boolean {
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (now > exp) {
        console.warn('[UploadToken] Token expirado');
        return false;
    }

    // Recomputar el HMAC y comparar
    const payload = `${memberId}:${petIndex}:${exp}`;
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

    // Comparación segura contra timing attacks
    try {
        return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    } catch {
        return false;
    }
}
