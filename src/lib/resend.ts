import { Resend } from 'resend';

/**
 * Cliente de Resend para envío de emails
 * Requiere la variable de entorno RESEND_API_KEY
 */
export const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Email desde el cual se enviarán las comunicaciones
export const DEFAULT_FROM_EMAIL = 'notificaciones@app.pataamiga.mx'; // Usando subdominio para evitar conflictos con Memberstack
export const DEFAULT_FROM_NAME = 'Club Pata Amiga';
